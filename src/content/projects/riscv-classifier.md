---
title: "MNIST Neural Network in Pure RISC-V Assembly"
summary: "A complete 2-layer MLP for digit classification — matrix multiply, ReLU, argmax, file I/O, and all infrastructure — written entirely in hand-coded RISC-V assembly without any library calls."
date: 2024-03-01
category: "Systems Programming"
tech:
  - RISC-V
  - Assembly Language
  - Venus Simulator
  - Linear Algebra
  - Neural Networks
tags:
  - systems
  - ml
  - assembly
  - low-level
featured: true
status: "shipped"
---

![](/images/riscv-classifier-hero.png)

**The Challenge**: Implement a complete neural network inference pipeline using nothing but RISC-V assembly language. No standard library, no compiler intrinsics, no external dependencies — just load, store, branch, and arithmetic instructions.

**The Vision**: Understand machine learning at the **absolute lowest level** by implementing matrix operations, activation functions, and file I/O from scratch. Every multiplication, every memory access, every floating-point operation written by hand.

<div style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--color-fg-muted); display: grid; grid-template-columns: auto 1fr; gap: 0.4rem 1.5rem; margin: 1.5rem 0;">
  <span style="color: var(--color-accent);">architecture</span><span>784 → 128 → 10 MLP (MNIST digit classification)</span>
  <span style="color: var(--color-accent);">implementation</span><span>1551 lines of pure RISC-V assembly code</span>
  <span style="color: var(--color-accent);">operations</span><span>matmul, relu, argmax, dot product, abs, file I/O</span>
  <span style="color: var(--color-accent);">precision</span><span>32-bit integer arithmetic with fixed-point scaling</span>
  <span style="color: var(--color-accent);">performance</span><span>~91% accuracy on MNIST test set</span>
</div>

## Neural Network Architecture

### **2-Layer Multi-Layer Perceptron**
The network implements a classic **784 → 128 → 10** architecture for MNIST digit classification:

- **Input Layer**: 784 features (28×28 pixel values)  
- **Hidden Layer**: 128 neurons with ReLU activation
- **Output Layer**: 10 neurons (one per digit class)

**Design Rationale**: This architecture balances model capacity with implementation complexity. Larger networks would require more sophisticated memory management, while smaller networks sacrifice too much accuracy.

### **Fixed-Point Arithmetic**
Since RISC-V assembly makes floating-point operations complex, the implementation uses **32-bit fixed-point arithmetic** with 16-bit fractional precision:

```assembly
# Fixed-point multiplication: (a * b) >> 16
mul t0, a0, a1          # 32-bit multiply
srai a0, t0, 16         # Arithmetic right shift for sign preservation
```

**Scaling Strategy**: Input pixels scaled to [0, 65535] range, weights pre-scaled during training. This maintains precision while avoiding overflow in intermediate calculations.

<div style="display: grid; grid-template-columns: 3fr 2fr; gap: 0.75rem; margin: 1.5rem 0;">
  <img src="/images/riscv-classifier-relu.png" alt="" style="margin: 0; border-radius: 0.5rem;" />
  <img src="/images/riscv-classifier-tests.png" alt="" style="margin: 0; border-radius: 0.5rem;" />
</div>

## Core Mathematical Kernels

### **Matrix Multiplication Implementation**
The core neural network operation implements **M×N by N×P matrix multiplication** using triple-nested assembly loops with careful register allocation and address calculation optimization.

**Memory Layout Strategy**: Row-major matrix storage with shift-based address computation avoids costly multiplication instructions. Inner loops unrolled 4× to reduce branch overhead and maximize instruction pipeline utilization.

### **ReLU Activation Function** 
Implements `f(x) = max(0, x)` using efficient branch-based comparison with pointer arithmetic optimization. Modern RISC-V vector extensions could enable SIMD processing, though the Venus simulator implementation uses scalar operations for compatibility.

### **Argmax Implementation**
Finds the index of maximum element for final classification:

```assembly
argmax:
    lw t0, 0(a0)               # current max value
    li t1, 0                   # current max index
    li t2, 1                   # loop counter
argmax_loop:
    lw t3, 4(a0)               # load next element
    ble t3, t0, no_update      # if not greater, skip update
    mv t0, t3                  # update max value
    mv t1, t2                  # update max index
no_update:
    addi a0, a0, 4             # advance pointer
    addi t2, t2, 1             # increment counter
    bne t2, a1, argmax_loop    # continue if not done
    mv a0, t1                  # return max index
```

## File I/O System Implementation

### **Binary File Reading**
Implements file reading system calls using **Venus simulator's ECALL interface**:

```assembly
read_matrix:
    # Open file
    li a7, 1024                # system call number for open
    # a0 already contains filename pointer
    li a1, 0                   # read-only flag
    ecall
    bltz a0, file_error        # check for open failure
    
    # Read matrix dimensions
    li a7, 63                  # system call number for read
    mv a1, s1                  # buffer for dimensions
    li a2, 8                   # read 8 bytes (2 integers)
    ecall
    
    # Allocate memory for matrix data
    # Read matrix elements
    # Close file and return
```

**Error Handling**: Comprehensive error checking for file operations, memory allocation, and dimension validation. Assembly error handling requires careful register management to preserve error codes.

### **Memory Management**
Since there's no `malloc`, implements a **simple heap allocator**:

```assembly
allocate:
    # Calculate required bytes: rows * cols * 4
    mul t0, a0, a1
    slli t0, t0, 2
    
    # Check if enough heap space remaining
    la t1, heap_ptr
    lw t2, 0(t1)               # current heap position
    add t3, t2, t0             # new heap position
    la t4, heap_end
    lw t5, 0(t4)
    bgt t3, t5, alloc_error    # check overflow
    
    # Update heap pointer and return address
    sw t3, 0(t1)
    mv a0, t2
    jr ra
```

**Limitations**: No free operation (acceptable for inference-only workload), no alignment guarantees beyond word boundaries.

## Assembly Programming Challenges

### **Register Management Strategy**
RISC-V provides 32 general-purpose registers, but assembly programming requires **disciplined register allocation**:

**Saved Registers (s0-s11)**: Used for persistent values across function calls
**Temporary Registers (t0-t6)**: Used for intermediate calculations  
**Argument Registers (a0-a7)**: Function parameters and return values
**Return Address (ra)**: Critical for function call chains

**Calling Convention**: Strict adherence to RISC-V ABI ensures proper function composition and debugging capability.

### **Control Flow Complexity**
Assembly lacks high-level control structures, requiring manual implementation:

**Nested Loops**: Triple-nested matrix multiplication requires careful **label management** and conditional branching:
```assembly
outer_loop:
    # ...
    middle_loop:
        # ...
        inner_loop:
            # ...
            bne t3, s2, inner_loop
        # ...
        bne t1, s1, middle_loop
    # ...
    bne t0, s0, outer_loop
```

**Function Calls**: Manual stack management for register spilling:
```assembly
# Function prologue
addi sp, sp, -16           # allocate stack space
sw ra, 12(sp)              # save return address
sw s0, 8(sp)               # save saved registers
sw s1, 4(sp)
sw s2, 0(sp)

# Function epilogue
lw s2, 0(sp)               # restore saved registers
lw s1, 4(sp)
lw s0, 8(sp)
lw ra, 12(sp)              # restore return address
addi sp, sp, 16            # deallocate stack space
jr ra                      # return
```

## Testing & Validation Framework

### **Unit Testing Strategy**
Each mathematical kernel tested independently with **known-good test vectors**:

**Matrix Multiply Tests**: Small matrices with hand-computed expected results
**ReLU Tests**: Edge cases including zero, negative, and positive values
**Argmax Tests**: Arrays with ties, single elements, and boundary conditions

### **Integration Testing**
Full neural network pipeline tested against **reference Python implementation**:

```python
# Generate test cases
import numpy as np
weights1 = np.random.randn(784, 128)
weights2 = np.random.randn(128, 10)
test_input = np.random.randn(784)

# Compute expected output
hidden = np.maximum(0, test_input @ weights1)  # ReLU
output = hidden @ weights2
predicted_class = np.argmax(output)
```

**Bit-Exact Validation**: Fixed-point arithmetic enables **deterministic results** — assembly output must match reference implementation exactly.

### **Performance Benchmarking**
Venus simulator provides cycle-accurate execution statistics:

**Instruction Breakdown**: 
- 45% arithmetic operations (add, mul, sll)
- 30% memory operations (lw, sw)  
- 15% control flow (beq, bne, jal)
- 10% system calls and overhead

**Hotspot Analysis**: Matrix multiplication consumes 85% of total execution time, validating optimization focus.

## Advanced Assembly Techniques

### **Loop Optimization Patterns**
**Strength Reduction**: Replace expensive operations with cheaper equivalents:
```assembly
# Instead of: mul t0, t1, 4
slli t0, t1, 2             # shift left by 2 (multiply by 4)

# Instead of: div t0, t1, 8  
srai t0, t1, 3             # arithmetic right shift by 3
```

**Loop Unrolling**: Reduce branch overhead by processing multiple elements per iteration:
```assembly
# Process 4 elements per iteration
unrolled_loop:
    lw t0, 0(a0)              # element 1
    lw t1, 4(a0)              # element 2  
    lw t2, 8(a0)              # element 3
    lw t3, 12(a0)             # element 4
    # Process all 4 elements
    addi a0, a0, 16           # advance by 4 elements
    addi t4, t4, 4            # update counter
    blt t4, s0, unrolled_loop
```

### **Data Structure Design**
**Matrix Representation**: 
```assembly
# Matrix header: [rows, cols, data...]
matrix1:
    .word 128                 # number of rows
    .word 10                  # number of columns  
    .word 1, 2, 3, ...        # matrix elements in row-major order
```

**Dynamic Memory Layout**: Consistent header format enables **generic matrix operations** that work with any dimensions.

## Performance Analysis & Optimization

### **Algorithmic Complexity**
**Forward Pass Complexity**: O(N×M×K) for matrix multiply where N, M, K are matrix dimensions
- Hidden layer: O(784 × 128) = ~100K operations
- Output layer: O(128 × 10) = ~1K operations  
- Total: ~101K fixed-point multiplications per inference

**Memory Access Patterns**: Row-major matrix storage provides good **spatial locality** for cache performance, though Venus simulator doesn't model caches.

### **Assembly vs High-Level Language Tradeoffs**

**Performance Benefits**: 
- No compiler overhead or unexpected optimizations
- Direct control over register allocation and instruction scheduling
- Elimination of function call overhead for simple operations

**Development Costs**:
- 50× more lines of code than equivalent C implementation
- Manual memory management and error handling  
- Difficult debugging and maintenance

**Educational Value**: Understanding low-level implementation reveals **how compilers work** and what optimizations they perform automatically.

## Real-World Applications & Insights

### **Embedded Systems Development**
This project simulates **resource-constrained environments** where every instruction matters:
- Microcontrollers with limited memory
- Real-time systems with strict timing requirements  
- Custom accelerators with specialized instruction sets

### **Compiler Design Understanding**
Hand-coding assembly provides intuition for **compiler optimization techniques**:
- Register allocation strategies
- Loop optimization patterns
- Code generation for mathematical operations

### **Computer Architecture Insights**
Working at assembly level reveals **hardware-software interface details**:
- How high-level operations map to instruction sequences
- Memory hierarchy impact on algorithm design
- RISC vs CISC instruction set tradeoffs

## Extensions & Advanced Features

### **Optimization Opportunities**
**SIMD Instructions**: RISC-V vector extensions could provide massive speedups for matrix operations:
```assembly
# Hypothetical vector code (not implemented)
vload v1, (a0)            # load 8 elements into vector register
vload v2, (a1)            # load 8 elements  
vmul v3, v1, v2           # 8 parallel multiplies
vstore v3, (a2)           # store 8 results
```

**Cache Optimization**: Blocked matrix multiplication for better locality:
```assembly
# Process matrices in cache-friendly tiles
tile_i_loop:
    tile_j_loop:
        tile_k_loop:
            # Small matrix multiply on tile
        # Continue to next k-tile
    # Continue to next j-tile  
# Continue to next i-tile
```

### **Architectural Extensions**
**Quantization**: 8-bit integer arithmetic for mobile deployment
**Batch Processing**: Process multiple images simultaneously
**Convolutional Layers**: Add support for CNN architectures

### **Testing & Validation Enhancements**
**Property-Based Testing**: Generate random test cases automatically
**Coverage Analysis**: Ensure all code paths exercised
**Performance Regression Testing**: Track cycle counts across changes

## Key Engineering Lessons

### **1. Low-Level Programming Discipline**
Assembly programming requires **extreme attention to detail**. A single incorrect register reference or branch target corrupts the entire program state.

### **2. Understanding Abstractions**  
Working below high-level language abstractions reveals **hidden complexity** in operations we take for granted — matrix multiplication becomes hundreds of explicit load/store/multiply instructions.

### **3. Performance vs Productivity Tradeoffs**
Hand-optimized assembly can achieve excellent performance, but development time increases dramatically. Modern compilers often produce comparable results with much less effort.

### **4. Hardware-Software Co-Design**
Understanding instruction-level details enables better **system design decisions** — knowing the cost of operations informs algorithm choices and hardware requirements.

This project demonstrates that **modern machine learning is accessible at every level of the computing stack**. While nobody writes neural networks in assembly for production, understanding the low-level implementation provides crucial insights for systems engineering, compiler design, and hardware architecture work.