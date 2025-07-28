// Different types and enums for API responses

// Enums
// Enum values of these types MATTER!
// values based on the order of sections in a .wat file
export enum InjectType{
    // Lined up in order in terms of sections as well 
    // until the last 2(Local and Probe)
    //  which would depend on their function IDs
    Type = 1,
    Import = 2,
    Table = 3,
    Memory = 4,
    Tag = 5,
    Global = 6,
    Export = 7,
    // We don't support start as an inject type but the wat content can have this so necessary to handle it
    // Start = 7.5
    Element = 8,
    Func = 9,
    Data = 10,
    // Module will never be used
    Module = 11,
    Local,
    FuncProbe,
    FuncBodyProbe,
}

export const stringToInjectType: Record<string, InjectType> = {
    'type': InjectType.Type,
    'import': InjectType.Import,
    'table': InjectType.Table,
    'memory': InjectType.Memory,
    'tag': InjectType.Tag,
    'global': InjectType.Global,
    'export': InjectType.Export,
    'elem': InjectType.Element,
    'func': InjectType.Func,
    'data': InjectType.Data,
    'module': InjectType.Module,
}

export enum sectionNamesInOrder {type = "type", import = "import", table = "table", memory = "memory", tag = "tag", global  = "global",
                                    export = "export", start = "start", elem = "elem", func = "func", data = "data", custom = "custom"}
