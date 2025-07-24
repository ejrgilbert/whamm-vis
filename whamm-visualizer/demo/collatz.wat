(module
  (type (;0;) (func (result i32)))
  (type (;1;) (func (param i32 i32) (result i32)))
  (export "main" (func $main))
  (func $main (;0;) (type 0) (result i32)
    i32.const 27
    i32.const 0
    call $collatz_steps
  )
  (func $collatz_steps (;1;) (type 1) (param $n i32) (param $steps i32) (result i32)
    local.get $n
    i32.const 1
    i32.eq
    if (result i32) ;; label = @1
      local.get $steps
    else
      local.get $n
      i32.const 2
      i32.rem_u
      i32.eqz
      if (result i32) ;; label = @2
        local.get $n
        i32.const 2
        i32.div_u
      else
        local.get $n
        i32.const 3
        i32.mul
        i32.const 1
        i32.add
      end
      local.get $steps
      i32.const 1
      i32.add
      call $collatz_steps
    end
  )
)
