---
title: 'Pydantic Query Params: Handling Comma-Separated Lists with Enum Validation'
description: '## Problem'
pubDate: 'July 1, 2025'
tags: ['Patterns', 'Python']
---

## **Problem**

You're building a FastAPI endpoint that needs to filter data by multiple criteria. Your frontend sends filter parameters as comma-separated strings (because that's how query params work), but you want proper typing with enums and optional lists on the backend.

Classic scenario:

```

GET /api/products?status=ACTIVE,PENDING&category=ELECTRONICS,BOOKS
```

But Pydantic expects lists, and you want enum validation. Plus everything should be optional.

## **The Challenge**

Standard Pydantic approach fails here:

```python

class FilterParams(BaseModel):
    status: Optional[list[ProductStatus]] = None# Won't work with "ACTIVE,PENDING"
    category: Optional[list[str]] = None# Won't work with "ELECTRONICS,BOOKS"
```

The client sends `"ACTIVE,PENDING"` as a single string, but you need `[ProductStatus.ACTIVE, ProductStatus.PENDING]`.

## **Solution**

Use `BeforeValidator` with a custom parser that handles both string-to-list conversion and enum casting:

```python
from typing import Annotated, Optional
from pydantic import BaseModel, BeforeValidator
from enum import StrEnum

class ProductStatus(StrEnum):
    ACTIVE = "ACTIVE"
    PENDING = "PENDING"
    INACTIVE = "INACTIVE"

def parse_comma_separated_list(enum_type: Optional[type[StrEnum]] = None):
    def parser(v: list[str]):
# FastAPI wraps single values in lists
        value = v[0] if v else None
        if value is None:
            return None

        items = value.split(',')

# Cast to enum if provided
        if enum_type:
            return [enum_type(item) for item in items]

        return items

    return parser

class ProductFilterParams(BaseModel):
    status: Annotated[
        Optional[list[ProductStatus]],
        BeforeValidator(parse_comma_separated_list(ProductStatus))
    ] = None

    category: Annotated[
        Optional[list[str]],
        BeforeValidator(parse_comma_separated_list())
    ] = None

@router.get('/products')
async def list_products(
    filters: Annotated[ProductFilterParams, Query()],
):
# filters.status is now properly typed as list[ProductStatus] or None# filters.category is list[str] or None
    return await get_products(
        status=filters.status,
        category=filters.category
    )
```

## **How It Works**

1. **FastAPI Query Parsing**: FastAPI automatically wraps query param values in lists
2. **BeforeValidator**: Runs before Pydantic's standard validation
3. **String Splitting**: Takes the first item from the list (the comma-separated string) and splits it
4. **Enum Casting**: If enum type provided, casts each item to the enum
5. **Type Safety**: Final result is properly typed for your business logic

## **My Experience**

This hit me when refactoring an existing API. The frontend was using DiceUI filters that send multiple values as comma-separated strings. 

First attempt was parsing directly in each model - messy and not reusable. Every endpoint would need its own parsing logic.

After about 2 hours of digging through Pydantic docs, I found `BeforeValidator`. Perfect fit - handles the transformation before validation, keeps models clean, and works everywhere.

The beauty is writing minimal code that solves the problem once and reuses everywhere.

## **Why This Approach?**

- **Type Safety**: Full enum validation and IDE support
- **Optional by Design**: Handles missing params gracefully
- **Reusable**: Works with any enum or plain strings
- **Clean API**: Business logic gets properly typed data

The `BeforeValidator` pattern is perfect for these "format transformation + validation" scenarios.

---

That's it! Clean, reusable, and type-safe query param handling. If this helped you out, drop a like or share your own Pydantic tricks in the comments!

# 🚀

*Want more posts like this? If you like what I write you have a few options. Drop a comment/like anything. It all helps and  Thank you!* 

[kubaszw (@f.rankiee25) • Instagram profile](https://www.instagram.com/f.rankiee25/#)

[Kuba (@Kuba_Szw) on X](https://x.com/Kuba_Szw)

[Get an email whenever Kuba Szwajka publishes.](https://medium.com/@szwajkajakub/subscribe)

[www.linkedin.com](http://www.linkedin.com)