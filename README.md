# youchain-solc

JavaScript bindings for the [Solidity compiler](https://github.com/youchainhq/you-solidity).

Uses the Emscripten compiled Solidity found in the [solc-bin repository](https://github.com/youchainhq/solc-bin).

# YOUChain Features:

0.4.26 (2020-01-16)

Remove opcode DIFFICULTY.
About swarm hash: source filename irrelevant metadata, so to generate a more consistent swarm hash.

0.5.16 (2020-02-03)

Delete token units szabo and finney.

## Node.js Usage

To use the latest stable version of the Solidity compiler via Node.js you can install it via npm:

```bash
npm install youchain-solc
```

### Usage on the Command-Line

If this package is installed globally (`npm install -g youchain-solc`), a command-line tool called `solcjs` will be available.

To see all the supported features, execute:

```bash
youchain-solcjs --help
```

### Usage in Projects

There are two ways to use `youchain-solc`:

1. Through a high-level API giving a uniform interface to all compiler versions
2. Through a low-level API giving access to all the compiler interfaces, which depend on the version of the compiler

#### High-level API

The high-level API consists of a single method, `compile`, which expects the [Compiler Standard Input and Output JSON](https://solidity.readthedocs.io/en/v0.5.0/using-the-compiler.html#compiler-input-and-output-json-description).

It also accepts an optional callback function to resolve unmet dependencies. This callback receives a path and must synchronously return either an error or the content of the dependency as a string.
It cannot be used together with callback-based, asynchronous, filesystem access. A workaround is to collect the names of dependencies, return an error, and keep re-running the compiler until all
of them are resolved.

#### Example usage without the import callback

Example:

```javascript
var solc = require("youchain-solc");

var input = {
  language: "Solidity",
  sources: {
    "test.sol": {
      content: "contract C { function f() public { } }"
    }
  },
  settings: {
    outputSelection: {
      "*": {
        "*": ["*"]
      }
    }
  }
};

var output = JSON.parse(solc.compile(JSON.stringify(input)));

// `output` here contains the JSON output as specified in the documentation
for (var contractName in output.contracts["test.sol"]) {
  console.log(
    contractName +
      ": " +
      output.contracts["test.sol"][contractName].evm.bytecode.object
  );
}
```

#### Example usage with import callback

```javascript
var solc = require("youchain-solc");

var input = {
  language: "Solidity",
  sources: {
    "test.sol": {
      content: 'import "lib.sol"; contract C { function f() public { L.f(); } }'
    }
  },
  settings: {
    outputSelection: {
      "*": {
        "*": ["*"]
      }
    }
  }
};

function findImports(path) {
  if (path === "lib.sol")
    return {
      contents:
        "library L { function f() internal returns (uint) { return 7; } }"
    };
  else return { error: "File not found" };
}

var output = JSON.parse(solc.compile(JSON.stringify(input), findImports));

// `output` here contains the JSON output as specified in the documentation
for (var contractName in output.contracts["test.sol"]) {
  console.log(
    contractName +
      ": " +
      output.contracts["test.sol"][contractName].evm.bytecode.object
  );
}
```

### Using with Electron

**Note:**
If you are using Electron, `nodeIntegration` is on for `BrowserWindow` by default. If it is on, Electron will provide a `require` method which will not behave as expected and this may cause calls, such as `require('youchain-solc')`, to fail.

To turn off `nodeIntegration`, use the following:

```javascript
new BrowserWindow({
  webPreferences: {
    nodeIntegration: false
  }
});
```

### Using a Legacy Version

In order to compile contracts using a specific version of Solidity, the `solc.loadRemoteVersion(version, callback)` method is available. This returns a new `youchain-solc` object that uses a version of the compiler specified.

You can also load the "binary" manually and use `setupMethods` to create the familiar wrapper functions described above:
`var solc = solc.setupMethods(require("/my/local/soljson.js"))`.

### Using the Latest Development Snapshot

By default, the npm version is only created for releases. This prevents people from deploying contracts with non-release versions because they are less stable and harder to verify. If you would like to use the latest development snapshot (at your own risk!), you may use the following example code.

```javascript
var solc = require("youchain-solc");

// getting the development snapshot
solc.loadRemoteVersion("latest", function(err, solcSnapshot) {
  if (err) {
    // An error was encountered, display and quit
  } else {
    // NOTE: Use `solcSnapshot` here with the same interface `solc` has
  }
});
```

### Linking Bytecode

When using libraries, the resulting bytecode will contain placeholders for the real addresses of the referenced libraries. These have to be updated, via a process called linking, before deploying the contract.

The `linker` module (`require('youchain-solc/linker')`) offers helpers to accomplish this.

The `linkBytecode` method provides a simple helper for linking:

```javascript
var linker = require("youchain-solc/linker");

bytecode = linker.linkBytecode(bytecode, { MyLibrary: "0x123456..." });
```

As of Solidity 0.4.25 the compiler supports [standard JSON input and output](https://solidity.readthedocs.io/en/develop/using-the-compiler.html#compiler-input-and-output-json-description) which outputs a _link references_ map. This gives a map of library names to offsets in the bytecode to replace the addresses at. It also doesn't have the limitation on library file and contract name lengths.

There is a method available in the `linker` module called `findLinkReferences` which can find such link references in bytecode produced by an older compiler:

```javascript
var linker = require("youchain-solc/linker");

var linkReferences = linker.findLinkReferences(bytecode);
```

### Updating the ABI

The ABI generated by Solidity versions can differ slightly, due to new features introduced. There is a tool included which aims to translate the ABI generated by an older Solidity version to conform to the latest standard.

It can be used as:

```javascript
var abi = require("youchain-solc/abi");

var inputABI = [
  {
    constant: false,
    inputs: [],
    name: "hello",
    outputs: [{ name: "", type: "string" }],
    payable: false,
    type: "function"
  }
];
var outputABI = abi.update("0.3.6", inputABI);
// Output contains: [{"constant":false,"inputs":[],"name":"hello","outputs":[{"name":"","type":"string"}],"payable":true,"type":"function"},{"type":"fallback","payable":true}]
```

### Formatting old JSON assembly output

There is a helper available to format old JSON assembly output into a text familiar to earlier users of Remix IDE.

```
var translate = require('youchain-solc/translate')

// assemblyJSON refers to the JSON of the given assembly and sourceCode is the source of which the assembly was generated from
var output = translate.prettyPrintLegacyAssemblyJSON(assemblyJSON, sourceCode)
```

## Browser Usage

Add the version of `youchain-solc` you want to use into `index.html`:

```html
<script
  type="text/javascript"
  src="https://youchainhq.github.io/solc-bin/bin/{{ YOUCHAIN-SOLC VERSION }}.js"
></script>
```

(Alternatively use `https://youchainhq.github.io/solc-bin/bin/soljson-latest.js` to get the latest version.)

This will load `youchain-solc` into the global variable `window.Module`. Then use this inside Javascript as:

```javascript
var wrapper = require("youchain-solc/wrapper");
var solc = wrapper(window.Module);
```

Or in ES6 syntax:

```javascript
import * as wrapper from "youchain-solc/wrapper";
const solc = wrapper(window.Module);
```

Alternatively, to iterate the releases, one can load `list.js` from `solc-bin`:

```html
<script
  type="text/javascript"
  src="https://youchainhq.github.io/solc-bin/bin/list.js"
></script>
```

This will result in two global variables, `window.soljsonReleases` listing all releases and `window.soljsonSources` listing all nightly builds and releases.
