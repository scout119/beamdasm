// Copyright 2018 Valentin Ivanov (valen.ivanov@gmail.com)
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// https://github.com/erlang/otp/blob/master/lib/compiler/src/genop.tab

'use strict';

export const opcodes: any = {
  1: {
    ar: 1,
    nm: 'label',
    doc: '**label** *Lbl*\nSpecify a module local label. Label gives this code address a name *Lbl* and marks the start of a basic block.'
  },
  2: {
    ar: 3,
    nm: 'func_info',
    doc: '**func_info** *Module* *Function* *Arity*\nDefine a function *Module*:*Function*/*Arity*'
  },
  3: {
    ar: 0,
    nm: 'int_code_end',
    doc: 'int_code_end\n',
  },
  4: {
    ar: 2,
    nm: 'call',
    doc: '**call** *Arity* *Label*\nCall the function at *Label*. Save the next instruction as the return address in the CP register.'
  },
  5: {
    ar: 3,
    nm: 'call_last',
    doc: '**call_last** *Arity* *Label* *Deallocate*\nDeallocate and do a tail recursive call to the function at *Label*. Do not update the CP register. Before the call deallocate *Deallocate* words of stack.'
  },
  6: {
    ar: 2,
    nm: 'call_only',
    doc: '**call_only** *Arity* *Label*\nDo a tail recursive call to the function at *Label*. Do not update the CP register.'
  },
  7: {
    ar: 2,
    nm: 'call_ext',
    doc: '**call_ext** *Arity* *Destination*\nCall the function of arity *Arity* pointed by the *Destination*. Save the next instruction as the return address in the CP register.'
  },
  8: {
    ar: 3,
    nm: 'call_ext_last',
    doc: '**call_ext_last** *Arity* *Destination* *Deallocate*\nDeallocate and do a tail recursive call to function of arity *Arity* pointed by *Destination*. Dealllocate *Deallocte* words from the stack before the call.'
  },
  9: {
    ar: 2,
    nm: 'bif0',
    doc: '**bif0** *Bif* *Reg*\nCall the built-in function *Bif* and store the result in *Reg*.'
  },
  10: {
    ar: 4,
    nm: 'bif1',
    doc: '**bif1** *Lbl* *Bif* *Arg* *Reg*\nCall the buil-in function *Bif* with the argument *Arg*, and store the result in *Reg*. On failure jump to *Lbl*.'
  },
  11: {
    ar: 5,
    nm: 'bif2',
    doc: '**bif2** *Lbl* *Bif* *Arg1* *Arg2* *Reg*\nCall the built-in function *Bif* with the arguments *Arg1* and *Arg2*, and store the result in *Reg*. On failure jump to *Lbl*.'
  },
  12: {
    ar: 2,
    nm: 'allocate',
    doc: '**allocate** *StackNeed* *Live*\nAllocate space for *StackNeed* words on the stack. If GC is needed during allocation there are *Live* number of live X registers. Also save the continuation pointer (CP) on the stack.'
  },
  13: {
    ar: 3,
    nm: 'allocate_heap',
    doc: '**allocate_heap** *StackNeed* *HeapNeed* *Live*\nAllocate space for *StackNeed* words on the stack and ensure there is space for *HeepNeed* words on the heap. If GC is needed save *Live* number of X registers. Also save the continuation pointer (CP) on the stack.'
  },
  14: {
    ar: 2,
    nm: 'allocate_zero',
    doc: '**allocate_zero** *StackNeed* *Live*\nAllocate space for *StackNeed* words on the stack. If GC is needed during allocation there are *Live* number of live X registers. Clear the new stack words (by writing NIL). Also save the continuation pointer (CP) on the stack.'
  },
  15: {
    ar: 3,
    nm: 'allocate_heap_zero',
    doc: '**allocate_heap_zero** *StackNeed* *HeapNeed* *Live*\nAllocate space for *StackNeed* words on the stack and *HeapNeed* wordson the heap. If GC is needed during allocation there are *Live* number of live X registers. Clear the new stack words (by writing NIL). Also save the continuation pointer (CP) on the stack.'
  },
  16: {
    ar: 2,
    nm: 'test_heap',
    doc: '**test_heap** *HeepNeed* *Live*\nEnsure there is space for *HeepNeed* words on the heap. If GC is needed save *Live* number of X registers.'
  },
  17: {
    ar: 1,
    nm: 'init',
    doc: '**init** *N*\nClear the *Nth* stack word (by writing NIL).'
  },
  18: {
    ar: 1,
    nm: 'deallocate',
    doc: '**deallocate** *N*\nRestore the continuation pointer (CP) from the stack and deallocate *N+1*words from the stack (the +1 is for the CP).'
  },
  19: {
    ar: 0,
    nm: 'return',
    doc: '**return**\nReturn to the address in the continuation pointer (CP).'
  },
  20: {
    ar: 0,
    nm: 'send',
    doc: '**send**\n Send argument in x(1) as a message to the destination process in x(0). The message in x(1) ends up as the result of the send in x(0).'
  },
  21: {
    ar: 0,
    nm: 'remove_message',
    doc: '**remove_message**\nUnlink the current message from the message queue and store a pointer to the message in x(0). Remove any timeout.'
  },
  22: {
    ar: 0,
    nm: 'timeout',
    doc: '**timeout**\nReset the save point of the mailbox and clear the timeout flag.'
  },
  23: {
    ar: 2,
    nm: 'loop_rec',
    doc: '**loop_rec** *Label* *Source*\nLoop over the message queue, if it is empty jump to *Label*.'
  },
  24: {
    ar: 1,
    nm: 'loop_rec_end',
    doc: '**loop_rec_end** *Label*\nAdvance the save pointer to the next message and jump back to *Label*'
  },
  25: {
    ar: 1,
    nm: 'wait',
    doc: '**wait** *Label*\nSuspend the process and set the entry point to the beginning of the receive loop at *Label*.'
  },
  26: {
    ar: 2,
    nm: 'wait_timeout',
    doc: '**wait_timeout** *Label* *Time*\nSets up a timeout of *Time* milliseconds and saves the address of the following instruction as the entry point if the timeout triggers.'
  },
  27: { ar: 4, nm: 'm_plus' },
  28: { ar: 4, nm: 'm_minus' },
  29: { ar: 4, nm: 'm_times' },
  30: { ar: 4, nm: 'm_div' },
  31: { ar: 4, nm: 'int_div' },
  32: { ar: 4, nm: 'int_rem' },
  33: { ar: 4, nm: 'int_band' },
  34: { ar: 4, nm: 'int_bor' },
  35: { ar: 4, nm: 'int_bxor' },
  36: { ar: 4, nm: 'int_bsl' },
  37: { ar: 4, nm: 'int_bsr' },
  38: { ar: 3, nm: 'int_bnot' },
  39: {
    ar: 3,
    nm: 'is_lt',
    doc: '**is_lt** *Label* *Arg1* *Arg2*\nCompare two terms and jump to *Label* if *Arg1* is not less than *Arg2*.'
  },
  40: {
    ar: 3,
    nm: 'is_ge',
    doc: '**is_ge** *Label* *Arg1* *Arg2*\nCompare two terms and jump to *Label* if *Arg1* is less than *Arg2*.'
  },
  41: {
    ar: 3,
    nm: 'is_eq',
    doc: '**is_eq** *Label* *Arg1* *Arg2*\nCompare two terms and jump to *Label* is *Arg1* is not (numerically) equal to *Arg2*.'
  },
  42: {
    ar: 3,
    nm: 'is_ne',
    doc: '**is_ne** *Label* *Arg1* *Arg2*\nCompare two terms and jump to *Label* if *Arg1* is (numerically) equal to *Arg2*.'
  },
  43: {
    ar: 3,
    nm: 'is_eq_exact',
    doc: '**is_eq_exact** *Label* *Arg1* *Arg2*\nCompare two terms and jump to *Label* if *Arg1* is not exactly equal to *Arg2*.'
  },
  44: {
    ar: 3,
    nm: 'is_ne_exact',
    doc: '**is _ne_exact** *Label* *Arg1* *Arg2*\nCompare two terms and jump to *Label* if *Arg1* is exactly equal to *Arg2*.'
  },
  45: {
    ar: 2,
    nm: 'is_integer',
    doc: '**is_integer** *Label* *Arg*\nTest the type of *Arg* and jump to *Label* if it is not an integer.'
  },
  46: {
    ar: 2,
    nm: 'is_float',
    doc: '**is_float** *Label* *Arg*\nTest the type of *Arg* and jump to *Label* if it is not a float.'
  },
  47: {
    ar: 2,
    nm: 'is_number',
    doc: '**is_number** *Label* *Arg*\nTest the type of *Arg* and jump to *Label* if it is not a number.'
  },
  48: {
    ar: 2,
    nm: 'is_atom',
    doc: '**is_atom** *Label* *Arg*\nTest the type of *Arg* and jump to *Label* if it is not an atom.'
  },
  49: {
    ar: 2,
    nm: 'is_pid',
    doc: '**is_pid** *Label* *Arg*\nTest the type of *Arg* and jump to *Label* if it is not a pid.'
  },
  50: {
    ar: 2,
    nm: 'is_reference',
    doc: '**is_reference** *Label* *Arg*\nTest the type of *Arg* and jump to *Label* if it is not a reference.'
  },
  51: {
    ar: 2,
    nm: 'is_port',
    doc: '**is_port** *Label* *Arg*\nTest the type of *Arg* and jump to *Label* if it is not a port.'
  },
  52: {
    ar: 2,
    nm: 'is_nil',
    doc: '**is_nil** *Label* *Arg*\nTest the type of *Arg* and jump to *Label* if it is not nil.'
  },
  53: {
    ar: 2,
    nm: 'is_binary',
    doc: '**is_binary** *Label* *Arg*\nTest the type of *Arg* and jump to *Label* if it is not a binary.'
  },
  54: {
    ar: 2,
    nm: 'is_constant',
    doc: '**is_constant** *Label* *Arg*\nTest the type of *Arg* and jump to *Label* if it is not a constant.'
  },
  55: {
    ar: 2,
    nm: 'is_list',
    doc: '**is_list** *Label* *Arg*\nTest the type of *Arg* and jump to *Label* if it is not a cons or nil.'
  },
  56: {
    ar: 2,
    nm: 'is_nonempty_list',
    doc: '**is_nonempty_list** *Label* *Arg*\nTest the type of *Arg* and jump to *Label* if it is not a cons.'
  },
  57: {
    ar: 2,
    nm: 'is_tuple',
    doc: '**is_tuple** *Label* *Arg*\nTest the type of *Arg* and jump to *Label* if it is not a tuple.'
  },
  58: {
    ar: 3,
    nm: 'test_arity',
    doc: '**test_arity** *Label* *Arg* *Arity*\nTest the arity of the tuple in *Arg* and jump to *Label* if it is not equal to *Arity*.'
  },
  59: {
    ar: 3,
    nm: 'select_val',
    doc: '**select_val** *Arg* *FailLabel* *Destinations*\nJump to the destination label corresponding to *Arg* in the *Destinations* list, if no arity matches, jump to *FailLabel*.'
  },
  60: {
    ar: 3,
    nm: 'select_tuple_arity',
    doc: '**select_tuple_arity** *Tuple* *FailLabel* *Destiantions*\nCheck the arity of the tuple *Tuple* and jump to the corresponding destination label, if no arity matches, jump to *FailLabel*.'
  },
  61: {
    ar: 1,
    nm: 'jump',
    doc: '**jump** *Label*\nJump to *Label*.'
  },
  62: { ar: 2, nm: 'catch' },
  63: { ar: 1, nm: 'catch_end' },
  64: {
    ar: 2,
    nm: 'move',
    doc: '**move** *Source* *Destination*\nMove the source *Source* (a literal or a register) to the destination register *Destination*.'
  },
  65: {
    ar: 3,
    nm: 'get_list',
    doc: '**get_list** *Source* *Head* *Tail*\nGet the head and tail (or car and cdr) parts of a list (a cons cell) from *Source* and put them in the registers *Head* and *Tail*.'
  },
  66: {
    ar: 3,
    nm: 'get_tuple_element',
    doc: '**get_tuple_element** *Source* *Element* *Destination*\nGet element number *Element* from the tuple in *Source* and put it in the destination register *Destination*.'
  },
  67: {
    ar: 3,
    nm: 'set_tuple_element',
    doc: '**set_tuple_element** *NewElement* *Tuple* *Position*\nUpdate the element at position *Position* of the tuple *Tuple* with the new element *NewElement*.'
  },
  68: { ar: 3, nm: 'put_string' },
  69: { ar: 3, nm: 'put_list' },
  70: { ar: 2, nm: 'put_tuple' },
  71: { ar: 1, nm: 'put' },
  72: { ar: 1, nm: 'badmatch' },
  73: { ar: 0, nm: 'if_end' },
  74: { ar: 1, nm: 'case_end' },
  75: {
    ar: 1,
    nm: 'call_fun',
    doc: '**call_fun** *Arity*\nCall a fun of arity *Arity*. Assume arguments in registers x(0) to x(Arity-1) and that the fun is in x(Arity). Save the next instruction as the return address in the CP register.'
  },
  76: { ar: 3, nm: 'make_fun' },
  77: {
    ar: 2,
    nm: 'is_function',
    doc: '**is_function** *Label* *Arg*\nTest the type of *Arg* and jump to *Label* if it is not a function (i.e. fun or closure).'
  },
  78: {
    ar: 2,
    nm: 'call_ext_only',
    doc: '**call_ext_only** *Arity* *Desitnation*\nDo a tail recursive call to the function of arity *Arity* pointed by the *Destination*. Do not update the CP register.',
  },
  79: { ar: 2, nm: 'bs_start_match' },
  80: { ar: 5, nm: 'bs_get_integer' },
  81: { ar: 5, nm: 'bs_get_float' },
  82: { ar: 5, nm: 'bs_get_binary' },
  83: { ar: 4, nm: 'bs_skip_bits' },
  84: { ar: 2, nm: 'bs_test_tail' },
  85: { ar: 1, nm: 'bs_save' },
  86: { ar: 1, nm: 'bs_restore' },
  87: { ar: 2, nm: 'bs_init' },
  88: { ar: 2, nm: 'bs_final' },
  89: { ar: 5, nm: 'bs_put_integer' },
  90: { ar: 5, nm: 'bs_put_binary' },
  91: { ar: 5, nm: 'bs_put_float' },
  92: { ar: 2, nm: 'bs_put_string' },
  93: { ar: 1, nm: 'bs_need_buf' },
  94: { ar: 0, nm: 'fclearerror' },
  95: { ar: 1, nm: 'fcheckerror' },
  96: { ar: 2, nm: 'fmove' },
  97: { ar: 2, nm: 'fconv' },
  98: { ar: 4, nm: 'fadd' },
  99: { ar: 4, nm: 'fsub' },
  100: { ar: 4, nm: 'fmul' },
  101: { ar: 4, nm: 'fdiv' },
  102: { ar: 3, nm: 'fnegate' },
  103: { ar: 1, nm: 'make_fun2' },
  104: { ar: 2, nm: 'try' },
  105: { ar: 1, nm: 'try_end' },
  106: { ar: 1, nm: 'try_case' },
  107: { ar: 1, nm: 'try_case_end' },
  108: { ar: 2, nm: 'raise' },
  109: { ar: 6, nm: 'bs_init2' },
  110: { ar: 3, nm: 'bs_bits_to_bytes' },
  111: { ar: 5, nm: 'bs_add' },
  112: { ar: 1, nm: 'apply' },
  113: { ar: 2, nm: 'apply_last' },
  114: {
    ar: 2,
    nm: 'is_boolean',
    doc: '**is_boolean** *Label* *Arg*\nTest the type of *Arg* and jump to *Label* if it is not a Boolean.'
  },
  115: {
    ar: 3,
    nm: 'is_function2',
    doc: '**is_function2** *Label* *Arg* *Arity*\nTest the type of *Arg* and jump to *Label* if it is not a function of arity *Arity*.'
  },
  116: { ar: 5, nm: 'bs_start_match2' },
  117: { ar: 7, nm: 'bs_get_integer2' },
  118: { ar: 7, nm: 'bs_get_float2' },
  119: { ar: 7, nm: 'bs_get_binary2' },
  120: { ar: 5, nm: 'bs_skip_bits2' },
  121: { ar: 3, nm: 'bs_test_tail2' },
  122: { ar: 2, nm: 'bs_save2' },
  123: { ar: 2, nm: 'bs_restore2' },
  124: {
    ar: 5,
    nm: 'gc_bif1',
    doc: '**gc_bif1** *Label* *Live* *Bif* *Arg* *Reg*\nCall the built-in function *Bif* with the argument *Arg*, and store the result in *Reg*. On failure jump to *Label*. Do a garbage collection if necessary to allocate space on the heap for the result (saving *Live* number of X registers).'
  },
  125: {
    ar: 6,
    nm: 'gc_bif2',
    doc: '**gc_bif2** *Label* *Live*, *Bif* *Arg1* *Arg2* *Reg*\nCall the built-in function *Bif* with the arguments *Arg1* and *Arg2*, and store the result in *Reg*. On failure jump to *Label*. Do a garbage collection if necessary to allocate space to the heap for the result (saving *Live* number of X registers).'
  },
  126: { ar: 2, nm: 'bs_final2' },
  127: { ar: 2, nm: 'bs_bits_to_bytes2' },
  128: { ar: 2, nm: 'put_literal' },
  129: {
    ar: 2,
    nm: 'is_bitstr',
    doc: '**is_bitstr** *Label* *Arg*\nTest the type of *Arg* and jump to *Label* if it is not a bit string.'
  },
  130: { ar: 1, nm: 'bs_context_to_binary' },
  131: { ar: 3, nm: 'bs_test_unit' },
  132: { ar: 4, nm: 'bs_match_string' },
  133: { ar: 0, nm: 'bs_init_writable' },
  134: { ar: 8, nm: 'bs_append' },
  135: { ar: 6, nm: 'bs_private_append' },
  136: {
    ar: 2,
    nm: 'trim',
    doc: '**trim** *N* *Remaining*\nReduce the stack usage by *N* words, keeping the CP on the top of the stack.'
  },
  137: { ar: 6, nm: 'bs_init_bits' },
  138: { ar: 5, nm: 'bs_get_utf8' },
  139: { ar: 4, nm: 'bs_skip_utf8' },
  140: { ar: 5, nm: 'bs_get_utf16' },
  141: { ar: 4, nm: 'bs_skip_utf16' },
  142: { ar: 5, nm: 'bs_get_utf32' },
  143: { ar: 4, nm: 'bs_skip_utf32' },
  144: { ar: 3, nm: 'bs_utf8_size' },
  145: { ar: 3, nm: 'bs_put_utf8' },
  146: { ar: 3, nm: 'bs_utf16_size' },
  147: { ar: 3, nm: 'bs_put_utf16' },
  148: { ar: 3, nm: 'bs_put_utf32' },
  149: { ar: 0, nm: 'on_load' },
  150: {
    ar: 1,
    nm: 'recv_mark',
    doc: '**recv_mark** *Label*\nSave the end of the message queue and the address of the label *Label* so that a recv_set instruction can start scanning the inbox from this position.'
  },
  151: {
    ar: 1,
    nm: 'recv_set',
    doc: '**recv_set** *Label*\nCheck that the saved mark points to *Label* and set the save pointer in the message queue to the last position of the message queue saved by the recv_mark instruction.'
  },
  152: {
    ar: 7,
    nm: 'gc_bif3',
    doc: '**gc_bif3** *Label* *Live* *Bif* *Arg1* *Arg2* *Arg3* *Reg*\nCall the built-in function *Bif* with the arguments *Arg1*, *Arg2* and *Arg3*, and store the result in *Reg*. On failure jump to *Label*. Do a garbage collection if necessary to allocate space on the heap for the result (saving *Live* number of X registers).'
  },
  153: { ar: 1, nm: 'line' },
  154: { ar: 5, nm: 'put_map_assoc' },
  155: { ar: 5, nm: 'put_map_exact' },
  156: { ar: 2, nm: 'is_map' },
  157: { ar: 3, nm: 'has_map_fields' },
  158: { ar: 3, nm: 'get_map_elements' },
  159: {
    ar: 4,
    nm: 'is_tagged_tuple',
    doc: '**is_tagged_tuple** *Label* *Reg* *N* *Atom*\nTest the type of *Reg* and jumps to *Label* if it is not a tuple. Test the arity of *Reg* and jumps to *Label* if it is not *N*. Test the first element of the tuple and jumps to *Label* if it is not *Atom*.'
  },
  160: {
    ar: 0,
    nm: 'build_stacktrace',
    doc: '**built_stacktrace**\nGiven the raw stacktrace in x(0), build a cooked stacktrace suitable for human consumption. Store it in x(0). Destroys all other registers. Do a garbage collection if necessary to allocate space on the heap for the result.'
  },
  161: {
    ar: 0,
    nm: 'raw_raise',
    doc: '**raw_raise**\nThis instruction works like the erlang:raise/3 BIF, except that the stacktrace in x(2) must be a raw stacktrace. x(0) is the class of the exception (error, exit, or throw), x(1) is the exception term, and x(2) is the raw stackframe. If x(0) is not a valid class, the instruction will not throw an exception, but store the atom \'badarg\' in x(0) and execute the next instruction.'
  },
  162: {
    ar: 2,
    nm: 'get_hd',
    doc: '**get_hd** *Source* *Head*\nGet the head (or car) part of a list (a cons cell) from *Source* and put it into the register *Head*.'
  },
  163: {
    ar: 2,
    nm: 'get_tl',
    doc: '**get_tl** *Source* *Tail*\nGet the tail (or cdr) part of a list (a cons cell) from *Source* and put it into the register *Tail*.'
  },
  // OTP 22
  164: {
    ar: 2,
    nm: 'put_tuple2',
    doc: '**put_tuple2** *Destination* *Elements*\nBuild a tuple with the elements in the list *Elements* and put it into register *Destination*.'
  },
  165: {
    ar: 3,
    nm: 'bs_get_tail',
    doc: '**bs_get_tail** *Ctx* *Dst* *Live*\nSets *Dst* to the tail of *Ctx* at the current position.'
  },
  166: {
    ar: 4,
    nm: 'bs_start_match3',
    doc: '**bs_start_match3** *Fail* *Bin *Live* *Dst*\nStarts a binary match sequence.'
  },
  167: {
    ar: 3,
    nm: 'bs_get_position',
    doc: '**bs_get_position** *Ctx* *Dst* *Live*\nSets *Dst* to the current position of *Ctx*.'
  },
  168: {
    ar: 2,
    nm: 'bs_set_position',
    doc: '**bs_set_position** *Ctx* *Pos*\nSets the current position of *Ctx* to *Pos*.'
  },
  //OTP 23
  169: {
    ar: 2,
    nm: 'swap',
    doc: '**swap** *Register1* *Register2*\nSwaps the contents of two registers.'
  },
  170: {
    ar: 4,
    nm: 'bs_start_match4',
    doc: '**bs_start_match4** *Fail* *Bin* *Live* *Dst*\nAs *bs_start_match3*, but the fail label can be \'no_fail\' when we know it will never fail at runtime, or \'resume\' when we know the input is a match context.'
  }  
};

export const MAX_OPCODE = 170;

export function get_doc(name: string): string {
  for (let opcode = 1; opcode <= MAX_OPCODE; opcode++) {
    if (opcodes[opcode].nm === name) {
      return opcodes[opcode].doc;
    }
  }
  return '';
}
