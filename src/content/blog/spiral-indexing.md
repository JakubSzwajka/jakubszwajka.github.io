---
title: 'Spiral Indexing'
description: '- [https://github.com/JakubSzwajka/spiral-grid-indexing](https://github.com/JakubSzwajka/spiral-grid-indexing/blob/main/main.py)'
pubDate: 'December 31, 2023'
tags: ['Random']
---

# Github Repo:

- [https://github.com/JakubSzwajka/spiral-grid-indexing](https://github.com/JakubSzwajka/spiral-grid-indexing/blob/main/main.py)

**TLDR:**

```python
from math import sqrt, ceil
from enum import Enum

class RingBar(Enum):
    TOP = "TOP"
    LEFT = "LEFT"
    LOW = "LOW"
    RIGHT = "RIGHT"

def get_bar_for_index(index, last_index, size):
    if index > last_index - size:
        return RingBar.TOP
    elif index > last_index - (size - 1) - size:
        return RingBar.LEFT
    elif index > last_index - ((size - 1) * 2) - size:
        return RingBar.LOW
    else:
        return RingBar.RIGHT

def get_coords_for_index(index, ring_number, ring_last_index):
    last_ring_index_coords = (ring_number, ring_number)
    size = (ring_number * 2) + 1

    ring_bar = get_bar_for_index(index, ring_last_index, size)

    if ring_bar == RingBar.TOP:
        return (
            last_ring_index_coords[0] - (ring_last_index - index),
            last_ring_index_coords[1],
        )
    elif ring_bar == RingBar.LEFT:
        return (
            last_ring_index_coords[0] - size + 1,
            last_ring_index_coords[1] - ((ring_last_index - size + 1) - index),
        )
    elif ring_bar == RingBar.LOW:
        return (
            (last_ring_index_coords[0] - size + 1)
            + (ring_last_index - index - (2 * (size - 1))),
            last_ring_index_coords[1] - size + 1,
        )
    elif ring_bar == RingBar.RIGHT:
        return (
            last_ring_index_coords[0],
            (last_ring_index_coords[1] - size + 1)
            + (ring_last_index - index - (3 * (size - 1))),
        )

def main():
    for index in range(0, 40):
        # Calculate the ring number and last index directly
        ring_number = ceil((sqrt(1 + 8 * (index / 8)) - 1) / 2)
        ring_last_index = ring_number * (ring_number + 1) * 4

        if index <= ring_last_index:
            coords = get_coords_for_index(index, ring_number, ring_last_index)
            print("Index: ", index, coords)
        else:
            print("Index out of bound for current ring calculation.")

if __name__ == "__main__":
    main()
```

![Untitled](/blog-images/spiral-indexing/Untitled.png)

# **Exploring Spiral Grid Indexing**

Spiral grid indexing is a unique computational challenge. It's about mapping index positions to coordinates on a spiral grid, a problem that finds relevance in graphics, data visualization, and algorithm design.

**My approach was to answer those questions:** 

### On which ring number is the index I’m asking for?

```
20 21 22 23 24       <----- second ring
19 6  7  8  9        <----- first ring
18 5  0  1  10
17 4  3  2  11
16 15 14 13 12

ring_number = ceil((sqrt(1 + 8 * (index / 8)) - 1) / 2)
```

More details: 

1. **Understanding the Spiral Structure**: In your spiral grid indexing, each ring around the center increases in size. The first ring (around the center) has 8 elements, the second ring has 16 elements, the third has 24, and so on. Each ring has 8 more elements than the previous one.
2. **Formulating the Ring Index**: The total number of elements in all rings up to a certain ring number can be represented by an arithmetic series. For the nth ring, the total number of elements in all rings up to and including this ring is given by 
    
    $$
    8+16+24+...+8n
    $$
    
    This can be simplified to
    
    $$
    8(1+2+3+...+n)
    $$
    
3. **Arithmetic Series Summation**: The sum of the first `n` natural numbers is given by 
    
    $$
    \frac{n(n+1)}{2} 
    $$
    
    Therefore, the total number of elements up to the nth ring is 
    
    $$
    8*\frac{n(n+1)}{2} 
    $$
    
4. **Solving for the Ring Number**: To find the ring number for a given index, we need to solve for n in the equation
    
    $$
    8*\frac{n(n+1)}{2}  = index
    $$
    
    This leads to the quadratic equation
    
    $$
    n^2+n-index/4 = 0
    $$
    
    where: 
    
    $$
    a = 1
     
    
    $$
    
    $$
    b = 1
     
    
    $$
    
    $$
    c = - \frac{index}{4}
    $$
    
5. **Using the Quadratic Formula**: The quadratic formula in general form is  $ax^2 + bx + c = 0$. This can be used to provide solution for n in this form
    
    $$
    n = \frac{-b \pm \sqrt{b^2-4ac}}{2a}
    $$
    
    Simplifying this with $a = 1, b=1, c = - \frac{index}{4}$ we have
    
     
    
    $$
    n = \frac{-1 \pm \sqrt{1+8*index/8}}{2}
    $$
    
6. **Final Adjustment**: Since we are interested in the smallest integer value of n that satisfies this equation (because the index can be part of a partially filled outermost ring), we use the ceiling function **`ceil()`** to round up to the nearest integer.

### What is the biggest index in given ring?

```
20 21 22 23 24    <---- second ring - 24
19 6  7  8  9     <---- first ring - 8
18 5  0  1  10
17 4  3  2  11
16 15 14 13 12

ring_last_index = ring_number * (ring_number + 1) * 4
```

Based on those data I can calculate a few extra things: 

- the size of the given ring
    
    ```python
    size = (ring_number * 2) + 1
    ```
    
- last index coordinates
    
    ```python
    last_ring_index_coords = (ring_number, ring_number)
    ```
    
- on which bar, is the index I’m asking for. Is it top, left, bottom or right.
    
    ```python
    def get_bar_for_index(index, last_index, size):
        if index > last_index - size:
            return RingBar.TOP
        elif index > last_index - (size - 1) - size:
            return RingBar.LEFT
        elif index > last_index - ((size - 1) * 2) - size:
            return RingBar.LOW
        else:
            return RingBar.RIGHT
    ```
    

Knowing all those things I can simply calculate the coordinates of index I’m asking for.  

```python
def get_coords_for_index(index, ring_number, ring_last_index):
    last_ring_index_coords = (ring_number, ring_number)
    size = (ring_number * 2) + 1

    ring_bar = get_bar_for_index(index, ring_last_index, size)

    if ring_bar == RingBar.TOP:
        return (
            last_ring_index_coords[0] - (ring_last_index - index),
            last_ring_index_coords[1],
        )
    elif ring_bar == RingBar.LEFT:
        return (
            last_ring_index_coords[0] - size + 1,
            last_ring_index_coords[1] - ((ring_last_index - size + 1) - index),
        )
    elif ring_bar == RingBar.LOW:
        return (
            (last_ring_index_coords[0] - size + 1)
            + (ring_last_index - index - (2 * (size - 1))),
            last_ring_index_coords[1] - size + 1,
        )
    elif ring_bar == RingBar.RIGHT:
        return (
            last_ring_index_coords[0],
            (last_ring_index_coords[1] - size + 1)
            + (ring_last_index - index - (3 * (size - 1))),
        )
```

## Sample output:

Example output for the first 40 indexes with coordinates:

```
Index:  0 (0, 0)
Index:  1 (1, 0)
Index:  2 (1, -1)
Index:  3 (0, -1)
Index:  4 (-1, -1)
Index:  5 (-1, 0)
Index:  6 (-1, 1)
Index:  7 (0, 1)
Index:  8 (1, 1)
Index:  9 (2, 1)
Index:  10 (2, 0)
Index:  11 (2, -1)
Index:  12 (2, -2)
Index:  13 (1, -2)
Index:  14 (0, -2)
Index:  15 (-1, -2)
Index:  16 (-2, -2)
Index:  17 (-2, -1)
Index:  18 (-2, 0)
Index:  19 (-2, 1)
Index:  20 (-2, 2)
Index:  21 (-1, 2)
Index:  22 (0, 2)
Index:  23 (1, 2)
Index:  24 (2, 2)
Index:  25 (3, 2)
Index:  26 (3, 1)
Index:  27 (3, 0)
Index:  28 (3, -1)
Index:  29 (3, -2)
Index:  30 (3, -3)
Index:  31 (2, -3)
Index:  32 (1, -3)
Index:  33 (0, -3)
Index:  34 (-1, -3)
Index:  35 (-2, -3)
Index:  36 (-3, -3)
Index:  37 (-3, -2)
Index:  38 (-3, -1)
Index:  39 (-3, 0)
```

## Extra

- There is a script to plot this chart in repo 👆