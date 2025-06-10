export function coloredText(text: string | number, colorCode:number): string{
    return `\u001b[38;5;${colorCode}m${String(text)}\u001b[0m`
}

export function black(text:string | number): string{
    return coloredText(text, 0)
}

export function red(text:string | number): string{
    return coloredText(text, 1)
}

export function green(text:string | number): string{
    return coloredText(text, 2)
}

export function yellow(text:string | number): string{
    return coloredText(text, 3)
}


export function blue(text:string | number): string{
    return coloredText(text, 4)
}


export function magenta(text:string | number): string{
    return coloredText(text, 5)
}

export function cyan(text:string | number): string{
    return coloredText(text, 6)
}

export function white(text:string | number): string{
    return coloredText(text, 7)
}

export function grey(text: string | number): string {
    return coloredText(text, 235);
}

for (let i = 0; i < 256 ; i++){
    process.stdout.write(coloredText(i + " ",i))
}
console.log()