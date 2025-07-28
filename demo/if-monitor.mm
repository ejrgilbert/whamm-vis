wasm::if:before {
    report var taken: i32;
    report var not_taken: i32;

    // which branch was taken?
    if (arg0 != 0) {
        taken++;
    } else {
        not_taken++;
    }
}
