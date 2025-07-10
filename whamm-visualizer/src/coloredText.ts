export function coloredText(text: string | number, colorCode:number): string{
    return `\u001b[38;5;${colorCode}m${String(text)}\u001b[0m`;
}

export function black(text:string | number): string{
    return coloredText(text, 8);
}

export function red(text:string | number): string{
    return coloredText(text, 9);
}

export function green(text:string | number): string{
    return coloredText(text, 10);
}

export function yellow(text:string | number): string{
    return coloredText(text, 11);
}

export function blue(text:string | number): string{
    return coloredText(text, 12);
}

export function magenta(text:string | number): string{
    return coloredText(text, 13);
}

export function cyan(text:string | number): string{
    return coloredText(text, 14);
}

export function white(text:string | number): string{
    return coloredText(text, 15);
}

export function grey(text: string | number): string {
    return coloredText(text, 235);
}

export function printColorCodes(){
    for (let i = 0; i < 256 ; i++){
        process.stdout.write(coloredText(i + " ",i));
    }
    console.log();
}