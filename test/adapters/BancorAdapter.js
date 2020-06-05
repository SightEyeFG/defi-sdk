import displayToken from '../helpers/displayToken';

const AdapterRegistry = artifacts.require('./AdapterRegistry');
const ProtocolAdapter = artifacts.require('./BancorAdapter');
const TokenAdapter = artifacts.require('./BancorTokenAdapter');
const ERC20TokenAdapter = artifacts.require('./ERC20TokenAdapter');

contract.skip('BancorAdapter', () => {
  const bntBethPoolAddress = '0xb1CD6e4153B2a390Cf00A6556b0fC1458C4A5533';
  const bntAddress = '0x1F573D6Fb3F13d689FF844B4cE37794d79a7FF1C';
  const bethAddress = '0xc0829421C1d260BD3cB3E0F06cfE2D52db2cE315';
  const testAddress = '0x42b9dF65B219B3dD36FF330A4dD8f327A6Ada990';

  let accounts;
  let adapterRegistry;
  let protocolAdapterAddress;
  let tokenAdapterAddress;
  let erc20TokenAdapterAddress;
  const bntBethPool = [
    bntBethPoolAddress,
    web3.eth.abi.encodeParameter('bytes32', web3.utils.toHex('SmartToken')),
    [
      'BNT Smart Token Relay',
      'ETHBNT',
      '18',
    ],
  ];
  const bnt = [
    bntAddress,
    web3.eth.abi.encodeParameter('bytes32', web3.utils.toHex('ERC20')),
    [
      'Bancor Network Token',
      'BNT',
      '18',
    ],
  ];
  const beth = [
    bethAddress,
    web3.eth.abi.encodeParameter('bytes32', web3.utils.toHex('ERC20')),
    [
      'Ether Token',
      'ETH',
      '18',
    ],
  ];

  beforeEach(async () => {
    accounts = await web3.eth.getAccounts();
    await ProtocolAdapter.new({ from: accounts[0] })
      .then((result) => {
        protocolAdapterAddress = result.address;
      });
    await TokenAdapter.new({ from: accounts[0] })
      .then((result) => {
        tokenAdapterAddress = result.address;
      });
    await ERC20TokenAdapter.new({ from: accounts[0] })
      .then((result) => {
        erc20TokenAdapterAddress = result.address;
      });
    await AdapterRegistry.new({ from: accounts[0] })
      .then((result) => {
        adapterRegistry = result.contract;
      });
    await adapterRegistry.methods.addProtocols(
      [web3.utils.toHex('Bancor')],
      [[
        'Mock Protocol Name',
        'Mock protocol description',
        'Mock website',
        'Mock icon',
        '0',
      ]],
      [[
        protocolAdapterAddress,
      ]],
      [[[
        bntBethPoolAddress,
      ]]],
    )
      .send({
        from: accounts[0],
        gas: '1000000',
      });
    await adapterRegistry.methods.addTokenAdapters(
      [web3.utils.toHex('ERC20'), web3.utils.toHex('SmartToken')],
      [erc20TokenAdapterAddress, tokenAdapterAddress],
    )
      .send({
        from: accounts[0],
        gas: '1000000',
      });
  });

  it('should return correct balances', async () => {
    await adapterRegistry.methods.getBalances(testAddress)
      .call()
      .then(async (result) => {
        await displayToken(adapterRegistry, result[0].adapterBalances[0].balances[0]);
      });
    await adapterRegistry.methods.getFinalFullTokenBalances(
      [
        web3.utils.toHex('SmartToken'),
      ],
      [
        bntBethPoolAddress,
      ],
    )
      .call()
      .then((result) => {
        assert.deepEqual(result[0].base.metadata, bntBethPool);
        assert.deepEqual(result[0].underlying[0].metadata, bnt);
        assert.deepEqual(result[0].underlying[1].metadata, beth);
      });
  });
});