const assert = require('assert');
const fs = require('fs');
const path = require('path')
const shell = require('shelljs');

const verify = require('../../util/verifiers')
const mock = require('../../util/integration.truffle');
const plugin = require('../../../dist/truffle.plugin');

// =======================
// CLI Options / Flags
// =======================

describe('Truffle Plugin: command line options', function() {
  let truffleConfig;
  let solcoverConfig;

  beforeEach(() => {
    mock.clean();

    mock.loggerOutput.val = '';
    solcoverConfig = {};
    truffleConfig = mock.getDefaultTruffleConfig();
  })

  afterEach(() => mock.clean());

  it('truffle run coverage --file test/<fileName>', async function() {
    verify.cleanInitialState();

    truffleConfig.file = path.join(
      truffleConfig.working_directory,
      'test/specific_a.js'
    );

    mock.installFullProject('test-files');
    await plugin(truffleConfig);

    const expected = [
      {
        file: mock.pathToContract(truffleConfig, 'ContractA.sol'),
        pct: 100
      },
      {
        file: mock.pathToContract(truffleConfig, 'ContractB.sol'),
        pct: 0,
      },
      {
        file: mock.pathToContract(truffleConfig, 'ContractC.sol'),
        pct: 0,
      },
    ];

    verify.lineCoverage(expected);
  });

  it('truffle run coverage --file test/<glob*>', async function() {
    verify.cleanInitialState();

    truffleConfig.file = path.join(
      truffleConfig.working_directory,
      'test/globby*'
    );

    mock.installFullProject('test-files');
    await plugin(truffleConfig);

    const expected = [
      {
        file: mock.pathToContract(truffleConfig, 'ContractA.sol'),
        pct: 0,
      },
      {
        file: mock.pathToContract(truffleConfig, 'ContractB.sol'),
        pct: 100,
      },
      {
        file: mock.pathToContract(truffleConfig, 'ContractC.sol'),
        pct: 100,
      },
    ];

    verify.lineCoverage(expected);
  });

  it('truffle run coverage --file test/gl{o,b}*.js', async function() {
    verify.cleanInitialState();

    truffleConfig.file = path.join(
      truffleConfig.working_directory,
      'test/gl{o,b}*.js'
    );

    mock.installFullProject('test-files');
    await plugin(truffleConfig);

    const expected = [
      {
        file: mock.pathToContract(truffleConfig, 'ContractA.sol'),
        pct: 0,
      },
      {
        file: mock.pathToContract(truffleConfig, 'ContractB.sol'),
        pct: 100,
      },
      {
        file: mock.pathToContract(truffleConfig, 'ContractC.sol'),
        pct: 100,
      },
    ];

    verify.lineCoverage(expected);
  });

    it('truffle run coverage --config ../.solcover.js', async function() {
    verify.cleanInitialState();

    solcoverConfig = {
      silent: process.env.SILENT ? true : false,
      istanbulReporter: ['json-summary', 'text']
    };

    // Write solcoverjs to parent dir of sc_temp (where the test project is installed)
    fs.writeFileSync(
      '.solcover.js',
      `module.exports=${JSON.stringify(solcoverConfig)}`
    );

    // This relative path has to be ./ prefixed (it's path.joined to truffle's working_directory)
    truffleConfig.solcoverjs = './../.solcover.js';

    mock.install('Simple', 'simple.js');
    await plugin(truffleConfig);

    // The relative solcoverjs uses the json-summary reporter
    const expected = [{
      file: mock.pathToContract(truffleConfig, 'Simple.sol'),
      pct: 100
    }];

    verify.lineCoverage(expected);
    shell.rm('.solcover.js');
  });

  it('truffle run coverage --help', async function(){
    verify.cleanInitialState();

    truffleConfig.help = "true";
    truffleConfig.logger = mock.testLogger;

    mock.install('Simple', 'simple.js', solcoverConfig);
    await plugin(truffleConfig);

    assert(
      mock.loggerOutput.val.includes('Usage'),
      `Should output help with Usage instruction : ${mock.loggerOutput.val}`
    );
  })

  it('truffle run coverage --version', async function(){
    verify.cleanInitialState();

    truffleConfig.version = "true";
    truffleConfig.logger = mock.testLogger;

    mock.install('Simple', 'simple.js', solcoverConfig);
    await plugin(truffleConfig);

    assert(
      mock.loggerOutput.val.includes('truffle'),
      `Should output truffle version: ${mock.loggerOutput.val}`
    );

    assert(
      mock.loggerOutput.val.includes('ganache-core'),
      `Should output ganache-core version: ${mock.loggerOutput.val}`
    );

    assert(
      mock.loggerOutput.val.includes('solidity-coverage'),
      `Should output solidity-coverage version: ${mock.loggerOutput.val}`
    );

  })

  it('truffle run coverage --useGlobalTruffle', async function(){
    verify.cleanInitialState();

    truffleConfig.useGlobalTruffle = true;
    truffleConfig.logger = mock.testLogger;

    mock.install('Simple', 'simple.js', solcoverConfig);
    await plugin(truffleConfig);

    assert(
      mock.loggerOutput.val.includes('global node_modules'),
      `Should notify it's using global truffle: ${mock.loggerOutput.val}`
    );
  });

  it('truffle run coverage --usePluginTruffle', async function(){
    verify.cleanInitialState();

    truffleConfig.usePluginTruffle = true;
    truffleConfig.logger = mock.testLogger;

    mock.install('Simple', 'simple.js', solcoverConfig);
    await plugin(truffleConfig);

    assert(
      mock.loggerOutput.val.includes('fallback Truffle library module'),
      `Should notify it's using plugin truffle lib copy: ${mock.loggerOutput.val}`
    );
  });
});

