export interface FunctionSymbol {
  name: string;
  modifiers: string[];
  params: string[];
  returns: string[];
  code: string;
}

export interface MethodSymbol {
  key: string;
  receiver: string;
  name: string;
  modifiers: string[];
  params: string[];
  returns: string[];
  code: string;
}

export interface ClassSymbol {
  name: string;
  modifiers: string[];
  extendsName?: string;
  implementsNames: string[];
  methodCount: number;
  code: string;
}

export interface InterfaceSymbol {
  name: string;
  modifiers: string[];
  extendsNames: string[];
  methods: string[];
  code: string;
}

export interface ExtractedSymbols {
  functions: FunctionSymbol[];
  methods: MethodSymbol[];
  classes: ClassSymbol[];
  interfaces: InterfaceSymbol[];
}
