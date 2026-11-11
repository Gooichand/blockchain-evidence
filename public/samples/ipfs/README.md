# Original UnixFS CAR fixtures

Generated locally with scripts/ipfs-vendor-build/generate-samples.mjs. demo.car contains an original multi-block UnixFS file, expected.txt its reconstructed bytes; tampered.car changes a block without changing its CID; missing-block.car omits a linked block; directory.car contains two original files. No files were uploaded or pinned. CAR bytes are inert test input, not a live IPFS availability claim.
