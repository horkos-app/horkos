/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/horkos.json`.
 */
export type Horkos = {
  "address": "AsGTHWf1Cix3TuD2uk4xEewv4MetpSR1W6coCBA2TG6K",
  "metadata": {
    "name": "horkos",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "claim",
      "discriminator": [
        62,
        198,
        214,
        193,
        213,
        159,
        108,
        210
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "issuer"
          ]
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "master",
          "writable": true,
          "relations": [
            "config"
          ]
        },
        {
          "name": "issuer",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  115,
                  115,
                  117,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          },
          "relations": [
            "licenseType"
          ]
        },
        {
          "name": "licenseType",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  121,
                  112,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "issuer"
              },
              {
                "kind": "account",
                "path": "licenseType.id",
                "account": "licenseType"
              }
            ]
          },
          "relations": [
            "license"
          ]
        },
        {
          "name": "license",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  105,
                  99,
                  101,
                  110,
                  115,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "licenseType"
              },
              {
                "kind": "account",
                "path": "license.owner",
                "account": "license"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "createLicenseType",
      "discriminator": [
        2,
        75,
        39,
        4,
        129,
        35,
        223,
        54
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "issuer"
          ]
        },
        {
          "name": "issuer",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  115,
                  115,
                  117,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "licenseType",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  121,
                  112,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "issuer"
              },
              {
                "kind": "arg",
                "path": "id"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "id",
          "type": "u64"
        },
        {
          "name": "priceLamports",
          "type": "u64"
        },
        {
          "name": "durationSecs",
          "type": "i64"
        },
        {
          "name": "resignWindowSecs",
          "type": "i64"
        },
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "description",
          "type": "string"
        }
      ]
    },
    {
      "name": "initConfig",
      "discriminator": [
        23,
        235,
        115,
        232,
        168,
        96,
        1,
        231
      ],
      "accounts": [
        {
          "name": "master",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "programData",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  146,
                  153,
                  178,
                  29,
                  115,
                  109,
                  121,
                  171,
                  148,
                  60,
                  104,
                  213,
                  136,
                  138,
                  97,
                  152,
                  232,
                  178,
                  116,
                  218,
                  88,
                  120,
                  59,
                  232,
                  184,
                  152,
                  212,
                  30,
                  215,
                  33,
                  168,
                  16
                ]
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                2,
                168,
                246,
                145,
                78,
                136,
                161,
                176,
                226,
                16,
                21,
                62,
                247,
                99,
                174,
                43,
                0,
                194,
                185,
                61,
                22,
                193,
                36,
                210,
                192,
                83,
                122,
                16,
                4,
                128,
                0,
                0
              ]
            }
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "purchase",
      "discriminator": [
        21,
        93,
        113,
        154,
        193,
        160,
        242,
        168
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "issuer",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  115,
                  115,
                  117,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "issuer.authority",
                "account": "issuer"
              }
            ]
          },
          "relations": [
            "licenseType"
          ]
        },
        {
          "name": "licenseType",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  121,
                  112,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "issuer"
              },
              {
                "kind": "account",
                "path": "licenseType.id",
                "account": "licenseType"
              }
            ]
          }
        },
        {
          "name": "license",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  105,
                  99,
                  101,
                  110,
                  115,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "licenseType"
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "purchaseIssuer",
      "discriminator": [
        7,
        108,
        244,
        185,
        247,
        16,
        42,
        178
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "master",
          "writable": true,
          "relations": [
            "config"
          ]
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "issuer",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  115,
                  115,
                  117,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        }
      ]
    },
    {
      "name": "renew",
      "discriminator": [
        43,
        239,
        15,
        46,
        27,
        7,
        163,
        73
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true,
          "relations": [
            "license"
          ]
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "master",
          "writable": true,
          "relations": [
            "config"
          ]
        },
        {
          "name": "issuer",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  115,
                  115,
                  117,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "issuer.authority",
                "account": "issuer"
              }
            ]
          },
          "relations": [
            "licenseType"
          ]
        },
        {
          "name": "authority",
          "writable": true,
          "relations": [
            "issuer"
          ]
        },
        {
          "name": "licenseType",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  121,
                  112,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "issuer"
              },
              {
                "kind": "account",
                "path": "licenseType.id",
                "account": "licenseType"
              }
            ]
          },
          "relations": [
            "license"
          ]
        },
        {
          "name": "license",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  105,
                  99,
                  101,
                  110,
                  115,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "licenseType"
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "resign",
      "discriminator": [
        177,
        177,
        153,
        96,
        88,
        149,
        206,
        225
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true,
          "relations": [
            "license"
          ]
        },
        {
          "name": "licenseType",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  121,
                  112,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "licenseType.issuer",
                "account": "licenseType"
              },
              {
                "kind": "account",
                "path": "licenseType.id",
                "account": "licenseType"
              }
            ]
          },
          "relations": [
            "license"
          ]
        },
        {
          "name": "license",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  105,
                  99,
                  101,
                  110,
                  115,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "licenseType"
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "updateConfig",
      "discriminator": [
        29,
        158,
        252,
        191,
        10,
        83,
        219,
        99
      ],
      "accounts": [
        {
          "name": "master",
          "signer": true,
          "relations": [
            "config"
          ]
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "issuerFeeLamports",
          "type": "u64"
        }
      ]
    },
    {
      "name": "updateFee",
      "discriminator": [
        232,
        253,
        195,
        247,
        148,
        212,
        73,
        222
      ],
      "accounts": [
        {
          "name": "master",
          "signer": true,
          "relations": [
            "config"
          ]
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "feeBps",
          "type": "u16"
        }
      ]
    },
    {
      "name": "updateIssuer",
      "discriminator": [
        9,
        100,
        234,
        30,
        84,
        43,
        30,
        29
      ],
      "accounts": [
        {
          "name": "master",
          "signer": true,
          "relations": [
            "config"
          ]
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "issuer",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  115,
                  115,
                  117,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "issuer.authority",
                "account": "issuer"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "active",
          "type": "bool"
        }
      ]
    },
    {
      "name": "updateLicenseType",
      "discriminator": [
        133,
        166,
        195,
        1,
        1,
        101,
        53,
        216
      ],
      "accounts": [
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "issuer"
          ]
        },
        {
          "name": "issuer",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  115,
                  115,
                  117,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          },
          "relations": [
            "licenseType"
          ]
        },
        {
          "name": "licenseType",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  121,
                  112,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "issuer"
              },
              {
                "kind": "account",
                "path": "licenseType.id",
                "account": "licenseType"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "priceLamports",
          "type": "u64"
        },
        {
          "name": "durationSecs",
          "type": "i64"
        },
        {
          "name": "resignWindowSecs",
          "type": "i64"
        },
        {
          "name": "active",
          "type": "bool"
        },
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "description",
          "type": "string"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "config",
      "discriminator": [
        155,
        12,
        170,
        224,
        30,
        250,
        204,
        130
      ]
    },
    {
      "name": "issuer",
      "discriminator": [
        216,
        19,
        83,
        230,
        108,
        53,
        80,
        14
      ]
    },
    {
      "name": "license",
      "discriminator": [
        248,
        152,
        195,
        100,
        185,
        108,
        176,
        231
      ]
    },
    {
      "name": "licenseType",
      "discriminator": [
        30,
        71,
        211,
        108,
        197,
        17,
        118,
        8
      ]
    }
  ],
  "events": [
    {
      "name": "feePaid",
      "discriminator": [
        159,
        12,
        52,
        212,
        249,
        36,
        24,
        18
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "unauthorized",
      "msg": "Signer is not authorized for this action"
    },
    {
      "code": 6001,
      "name": "issuerInactive",
      "msg": "Issuer is not active"
    },
    {
      "code": 6002,
      "name": "resignWindowOpen",
      "msg": "Resign window is still open"
    },
    {
      "code": 6003,
      "name": "resignWindowClosed",
      "msg": "Resign window has closed"
    },
    {
      "code": 6004,
      "name": "nothingToClaim",
      "msg": "No escrow to claim"
    },
    {
      "code": 6005,
      "name": "overflow",
      "msg": "Arithmetic overflow"
    },
    {
      "code": 6006,
      "name": "invalidParams",
      "msg": "Invalid license type parameters"
    },
    {
      "code": 6007,
      "name": "licenseTypeInactive",
      "msg": "License type is not active"
    },
    {
      "code": 6008,
      "name": "textTooLong",
      "msg": "Name or description too long"
    }
  ],
  "types": [
    {
      "name": "config",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "master",
            "type": "pubkey"
          },
          {
            "name": "feeBps",
            "type": "u16"
          },
          {
            "name": "issuerFeeLamports",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "feePaid",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "license",
            "type": "pubkey"
          },
          {
            "name": "licenseType",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "fee",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "issuer",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "active",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "name",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "license",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "licenseType",
            "type": "pubkey"
          },
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "paid",
            "type": "u64"
          },
          {
            "name": "resignDeadline",
            "type": "i64"
          },
          {
            "name": "prevExpiresAt",
            "type": "i64"
          },
          {
            "name": "expiresAt",
            "type": "i64"
          },
          {
            "name": "resigned",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "licenseType",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "issuer",
            "type": "pubkey"
          },
          {
            "name": "id",
            "type": "u64"
          },
          {
            "name": "priceLamports",
            "type": "u64"
          },
          {
            "name": "durationSecs",
            "type": "i64"
          },
          {
            "name": "resignWindowSecs",
            "type": "i64"
          },
          {
            "name": "active",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "description",
            "type": "string"
          }
        ]
      }
    }
  ],
  "constants": [
    {
      "name": "configSeed",
      "type": "bytes",
      "value": "[99, 111, 110, 102, 105, 103]"
    },
    {
      "name": "feeBps",
      "type": "u16",
      "value": "10"
    },
    {
      "name": "issuerFeeLamports",
      "type": "u64",
      "value": "1000000000"
    },
    {
      "name": "issuerSeed",
      "type": "bytes",
      "value": "[105, 115, 115, 117, 101, 114]"
    },
    {
      "name": "licenseSeed",
      "type": "bytes",
      "value": "[108, 105, 99, 101, 110, 115, 101]"
    },
    {
      "name": "licenseTypeSeed",
      "type": "bytes",
      "value": "[116, 121, 112, 101]"
    },
    {
      "name": "maxDescLen",
      "type": "u16",
      "value": "256"
    },
    {
      "name": "maxNameLen",
      "type": "u16",
      "value": "64"
    }
  ]
};
