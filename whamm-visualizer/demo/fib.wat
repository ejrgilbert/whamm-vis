(module
  (type (;0;) (func (result i32)))
  (type (;1;) (func (param i32 i32 i32) (result i32)))
  (export "main" (func $main))
  (func $main (;0;) (type 0) (result i32)
    i32.const 400
    i32.const 1
    i32.const 1
    call $fib
  )
  (func $fib (;1;) (type 1) (param $itter i32) (param $num1 i32) (param $num2 i32) (result i32)
    local.get $itter
    i32.const 1
    i32.gt_u
    if (result i32) ;; label = @1
      local.get $itter
      i32.const 1
      i32.sub
      local.get $num2
      local.get $num1
      local.get $num2
      i32.add
      call $fib
    else
      local.get $num1
    end
  )
)
