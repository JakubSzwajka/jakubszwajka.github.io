---
title: 'Local Development Server for AWS SAM Lambda Projects'
description: 'Right now I’m working on a project where REST API is built using AWS lambdas as request handlers. The whole thing uses [AWS SAM](https://aws.amazon.com/serverle...'
pubDate: 'September 28, 2024'
tags: ['AWS', 'HowTo']
---

Right now I’m working on a project where REST API is built using AWS lambdas as request handlers. The whole thing uses [AWS SAM](https://aws.amazon.com/serverless/sam/) to define lambdas, layers and connect it to Api Gateway in nice `template.yaml` file.

## The Problem

Testing this API locally isn't as straightforward as with other frameworks. While AWS provides `sam local` commands to build Docker images that host lambdas (which better replicate the Lambda environment), I found this approach too heavy for quick iterations during development.

## The Solution

I wanted a way to:

- Quickly test my business logic and data validations
- Provide a local server for frontend developers to test against
- Avoid the overhead of rebuilding Docker images for every change

So, I created a script to address these needs. 🤷‍♂️

**TL;DR**: Check out `server_local.py` in [this GitHub repository](https://github.com/JakubSzwajka/aws-sam-lambda-local-server-python).

## Key Benefits

- **Quick Setup**: Spins up a local Flask server that maps your API Gateway routes to Flask routes.
- **Direct Execution**: Triggers the Python function (Lambda handler) directly, without Docker overhead.
- **Hot Reload**: Changes are reflected immediately, shortening the development feedback loop.

[This example](https://github.com/JakubSzwajka/aws-sam-lambda-local-server-python) builds on the "Hello World" project from `sam init`, with `server_local.py` and its requirements added to enable local development.

## Reading the SAM Template

What I’m doing here is I’m reading the `template.yaml` first since there is current definition of my infrastructure and all the lambdas. 

All the code we need to create a dict definition is this. To handle functions specific for SAM template I’ve added some constructors to CloudFormationLoader. It now can support `Ref` as reference to another object, `Sub` as method to substitute and `GetAtt` to get attributes. I think we can add more logic here but right now this was totally sufficient to make it work. 

```python
import os
from typing import Any, Dict
import yaml

class CloudFormationLoader(yaml.SafeLoader):
    def __init__(self, stream):
        self._root = os.path.split(stream.name)[0]  # type: ignore
        super(CloudFormationLoader, self).__init__(stream)

    def include(self, node):
        filename = os.path.join(self._root, self.construct_scalar(node))  # type: ignore
        with open(filename, "r") as f:
            return yaml.load(f, CloudFormationLoader)

def construct_getatt(loader, node):
    if isinstance(node, yaml.ScalarNode):
        return {"Fn::GetAtt": loader.construct_scalar(node).split(".")}
    elif isinstance(node, yaml.SequenceNode):
        return {"Fn::GetAtt": loader.construct_sequence(node)}
    else:
        raise yaml.constructor.ConstructorError(
            None, None, f"Unexpected node type for !GetAtt: {type(node)}", node.start_mark
        )

CloudFormationLoader.add_constructor(
    "!Ref", lambda loader, node: {"Ref": loader.construct_scalar(node)}  # type: ignore
)
CloudFormationLoader.add_constructor(
    "!Sub", lambda loader, node: {"Fn::Sub": loader.construct_scalar(node)}  # type: ignore
)
CloudFormationLoader.add_constructor("!GetAtt", construct_getatt)

def load_template() -> Dict[str, Any]:
    with open("template.yaml", "r") as file:
        return yaml.load(file, Loader=CloudFormationLoader)

```

And this produces json like this:

```json
{
   "AWSTemplateFormatVersion":"2010-09-09",
   "Transform":"AWS::Serverless-2016-10-31",
   "Description":"sam-app\nSample SAM Template for sam-app\n",
   "Globals":{
      "Function":{
         "Timeout":3,
         "MemorySize":128,
         "LoggingConfig":{
            "LogFormat":"JSON"
         }
      }
   },
   "Resources":{
      "HelloWorldFunction":{
         "Type":"AWS::Serverless::Function",
         "Properties":{
            "CodeUri":"hello_world/",
            "Handler":"app.lambda_handler",
            "Runtime":"python3.9",
            "Architectures":[
               "x86_64"
            ],
            "Events":{
               "HelloWorld":{
                  "Type":"Api",
                  "Properties":{
                     "Path":"/hello",
                     "Method":"get"
                  }
               }
            }
         }
      }
   },
   "Outputs":{
      "HelloWorldApi":{
         "Description":"API Gateway endpoint URL for Prod stage for Hello World function",
         "Value":{
            "Fn::Sub":"https://${ServerlessRestApi}.execute-api.${AWS::Region}.amazonaws.com/Prod/hello/"
         }
      },
      "HelloWorldFunction":{
         "Description":"Hello World Lambda Function ARN",
         "Value":{
            "Fn::GetAtt":[
               "HelloWorldFunction",
               "Arn"
            ]
         }
      },
      "HelloWorldFunctionIamRole":{
         "Description":"Implicit IAM Role created for Hello World function",
         "Value":{
            "Fn::GetAtt":[
               "HelloWorldFunctionRole",
               "Arn"
            ]
         }
      }
   }
}
```

## Handling Layers

Having that its easy to dynamically create Flask routes for each endpoint. But before that something extra. 

In `sam init helloworld` app there are no layers defined. But I had this problem in my real project. To make it work properly I’ve added a function that reads layers definitions and add them to `sys.path` that python imports can work correctly. Check this: 

```python
def add_layers_to_path(template: Dict[str, Any]):
    """Add layers to path. Reads the template and adds the layers to the path for easier imports."""
    resources = template.get("Resources", {})
    for _, resource in resources.items():
        if resource.get("Type") == "AWS::Serverless::LayerVersion":
            layer_path = resource.get("Properties", {}).get("ContentUri")
            if layer_path:
                full_path = os.path.join(os.getcwd(), layer_path)
                if full_path not in sys.path:
                    sys.path.append(full_path)
```

## Creating Flask Routes

In the we need to loop throughout resources and find all functions. Based on that Im creating data need for flask routes. 

```python
def export_endpoints(template: Dict[str, Any]) -> List[Dict[str, str]]:
    endpoints = []
    resources = template.get("Resources", {})
    for resource_name, resource in resources.items():
        if resource.get("Type") == "AWS::Serverless::Function":
            properties = resource.get("Properties", {})
            events = properties.get("Events", {})
            for event_name, event in events.items():
                if event.get("Type") == "Api":
                    api_props = event.get("Properties", {})
                    path = api_props.get("Path")
                    method = api_props.get("Method")
                    handler = properties.get("Handler")
                    code_uri = properties.get("CodeUri")

                    if path and method and handler and code_uri:
                        endpoints.append(
                            {
                                "path": path,
                                "method": method,
                                "handler": handler,
                                "code_uri": code_uri,
                                "resource_name": resource_name,
                            }
                        )
    return endpoints
```

Then next step is to use it and setup a route for each one. 

```python
def setup_routes(template: Dict[str, Any]):
    endpoints = export_endpoints(template)
    for endpoint in endpoints:
        setup_route(
            endpoint["path"],
            endpoint["method"],
            endpoint["handler"],
            endpoint["code_uri"],
            endpoint["resource_name"],
        )

def setup_route(path: str, method: str, handler: str, code_uri: str, resource_name: str):
    module_name, function_name = handler.rsplit(".", 1)
    module_path = os.path.join(code_uri, f"{module_name}.py")
    spec = importlib.util.spec_from_file_location(module_name, module_path)
    if spec is None or spec.loader is None:
        raise Exception(f"Module {module_name} not found in {code_uri}")
    module = importlib.util.module_from_spec(spec)

    spec.loader.exec_module(module)
    handler_function = getattr(module, function_name)

    path = path.replace("{", "<").replace("}", ">")

    print(f"Setting up route for [{method}] {path} with handler {resource_name}.")

    # Create a unique route handler for each Lambda function
    def create_route_handler(handler_func):
        def route_handler(*args, **kwargs):
            event = {
                "httpMethod": request.method,
                "path": request.path,
                "queryStringParameters": request.args.to_dict(),
                "headers": dict(request.headers),
                "body": request.get_data(as_text=True),
                "pathParameters": kwargs,
            }
            context = LambdaContext(resource_name)
            response = handler_func(event, context)

            try:
                api_response = APIResponse(**response)
                headers = response.get("headers", {})
                return Response(
                    api_response.body,
                    status=api_response.statusCode,
                    headers=headers,
                    mimetype="application/json",
                )
            except ValidationError as e:
                return jsonify({"error": "Invalid response format", "details": e.errors()}), 500

        return route_handler

    # Use a unique endpoint name for each route
    endpoint_name = f"{resource_name}_{method}_{path.replace('/', '_')}"
    app.add_url_rule(
        path,
        endpoint=endpoint_name,
        view_func=create_route_handler(handler_function),
        methods=[method.upper(), "OPTIONS"],
    )

```

And you can start your server with

```python
if __name__ == "__main__":
    template = load_template()
    add_layers_to_path(template)
    setup_routes(template)
    app.run(debug=True, port=3000)
```

That’s it. The whole code available on github https://github.com/JakubSzwajka/aws-sam-lambda-local-server-python. Let me know if you find any corner case with layers etc. That can be improved or you think its worth adding something more to this. I find it very helpful. 

## Potential Issues

In short this works on your local environment. Keep in mind that lambdas has some memory limitations applied and cpu. In the end its good to test it in real environment. This approach should be used to just speed up development process.  

If you implement this in your project, please share your insights. Did it work well for you? Any challenges you faced? Your feedback helps improve this solution for everyone.