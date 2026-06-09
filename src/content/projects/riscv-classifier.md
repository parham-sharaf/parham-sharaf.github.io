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

<div style="margin: 1.5rem 0;">
  <img src="/images/riscv-classifier-hero.png" alt="Forward pass: 28×28 input digit → hidden activations → class logits → argmax" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

No standard library, no compiler, no floating-point hardware. A complete neural network inference pipeline in 1551 lines of RISC-V assembly: matrix multiply, ReLU, argmax, binary file I/O, a bump allocator, and the calling convention wiring to hold it all together.

<div style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--color-fg-muted); display: grid; grid-template-columns: auto 1fr; gap: 0.4rem 1.5rem; margin: 1.5rem 0;">
  <span style="color: var(--color-accent);">architecture</span><span>784 → 128 → 10 MLP (MNIST digit classification)</span>
  <span style="color: var(--color-accent);">arithmetic</span><span>32-bit fixed-point, 16-bit fractional precision (no FPU)</span>
  <span style="color: var(--color-accent);">memory</span><span>bump allocator — no malloc, no free, no heap library</span>
  <span style="color: var(--color-accent);">accuracy</span><span>~91% on MNIST test set, 46/46 unit tests passing</span>
</div>

## Network Architecture

<div style="margin: 1.5rem 0;">
  <img src="/images/riscv_mlp_architecture.png" alt="784 → 128 → 10 MLP architecture with operations labeled" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

The forward pass is two matrix multiplications separated by a ReLU:

$$\mathbf{h} = \text{ReLU}(W_1 \mathbf{x}), \qquad \hat{y} = \operatorname{argmax}(W_2 \mathbf{h})$$

where $W_1 \in \mathbb{R}^{128 \times 784}$, $W_2 \in \mathbb{R}^{10 \times 128}$, and all arithmetic is 32-bit fixed-point. Weights are pre-scaled during Python training so that the assembly only needs integer multiply-and-shift — no floating-point instructions anywhere in the binary.

Fixed-point multiplication: multiply two integers, then arithmetic-right-shift by 16 to recover the fractional result:

```asm
mul  t0, a0, a1     # 64-bit product in t0 (sign-extended)
srai a0, t0, 16     # scale back — preserves sign
```

## Matrix Multiply

The core kernel is a triple-nested loop over output rows, output columns, and the inner dimension. Row-major storage means the inner loop over the inner dimension is a sequential load — good spatial locality. The inner loop is unrolled 4× to reduce branch overhead.

Address arithmetic uses shift rather than multiply throughout:

```asm
slli t0, t1, 2      # byte offset = col * 4  (cheaper than mul)
add  t0, a0, t0     # pointer into row
lw   t2, 0(t0)      # load element
```

At 784×128 elements for the first layer, the forward pass does ~100K fixed-point multiply-accumulates. Venus cycle counts show matmul consuming 85% of total execution time.

## ReLU and Argmax

ReLU is a branch per element:

<div style="display: grid; grid-template-columns: 3fr 2fr; gap: 0.75rem; margin: 1.5rem 0; align-items: start;">
  <img src="/images/riscv-classifier-relu.png" alt="ReLU assembly implementation" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
  <div style="font-size: 0.9rem; line-height: 1.6; color: var(--color-fg-muted);">

The implementation loads each element, branches if already ≥ 0 (no write needed), otherwise writes 0. Pointer arithmetic advances by 4 bytes per element. A modern RISC-V vector extension could replace the loop with a single masked operation, but Venus doesn't support RVV.

  </div>
</div>

Argmax walks the output array keeping a running max value and max index in registers — no memory allocation, O(n) with minimal register pressure.

## File I/O and Memory

Matrix weights are read from binary files using Venus ECALL system calls: `open` (1024), `read` (63), `close` (57). The code reads the 8-byte header (rows, cols) first, then allocates the right amount of heap space, then reads the data.

The allocator is a 3-instruction bump pointer:

```asm
lw   t2, 0(t1)      # current heap_ptr
add  t3, t2, t0     # new heap_ptr = old + bytes
sw   t3, 0(t1)      # update heap_ptr
mv   a0, t2         # return old pointer
```

No `free` — inference only ever allocates, never releases. Heap overflow is checked explicitly before each allocation.

## Results

<div style="margin: 1.5rem 0;">
  <img src="/images/riscv_results.png" alt="Per-class accuracy on MNIST and instruction breakdown" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

91% overall accuracy on the MNIST test set. Digit 8 is the hardest (86%) — it shares structural features with 3, 5, and 9. Digits 0 and 1 are easiest (>98%) because their shapes are geometrically distinct.

<div style="margin: 1.5rem 0;">
  <img src="/images/riscv-classifier-tests.png" alt="46/46 unit tests passing in Venus simulator" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

Each kernel (abs, argmax, dot, matmul, relu, read\_matrix, write\_matrix) has independent unit tests with hand-computed expected outputs. All 46 tests pass, including error-code paths for invalid inputs, heap overflow, and file-not-found.

## What Writing Assembly Teaches

The main thing assembly forces: you cannot hide from the calling convention. Every function needs a prologue (push `ra`, `s0`–`sN`), every early exit needs the matching epilogue, and any mistake silently corrupts the return address. A high-level language handles this automatically — writing it by hand for 1551 lines gives a visceral sense of what compilers do and why calling conventions exist.

The fixed-point decision was also instructive. The Venus simulator doesn't model FPU instructions accurately, and the assignment spec required integer arithmetic. Pre-scaling weights in Python to fit the fixed-point range took about 10 lines of NumPy; the assembly itself never sees a float. The accuracy cost (91% vs ~97% for a float implementation) is entirely from quantization.
