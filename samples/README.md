# Hash & Integrity demo samples

These files are original, synthetic classroom content, not real evidence. They contain no personal data. Both files are deliberately small and have the same size; `changed.txt` differs from `original.txt` in exactly one byte: `Value: 100` becomes `Value: 101`.

## Keep the bytes unchanged

Use these files directly from the repository. Do not open and save them in an editor before the demo: changing line endings or adding a newline changes every hash. This folder's `.gitattributes` entry disables text conversion for the two sample files so their bytes remain the same on Windows, macOS and Linux.

## Before the demo

Start your existing configured local DGC server, sign in as a forensic analyst and open Tools > Hash & Integrity. Add files through the Evidence Vault. None of the first four tools uploads a file; Blockchain Verification sends only its SHA-256 digest to your server for a read-only lookup. No wallet transaction is made.

## 1. SHA-256 Generator

1. Add `samples/original.txt` to the Evidence Vault.
2. Open SHA-256 Generator and click **Generate hashes**.
3. Compare the result with the original file's SHA256 value below, then use Copy.

Say: "This is a fingerprint of these exact bytes. Generating it alone does not prove where the file came from."

## 2. Hash Comparison

1. Open Hash Comparison. A file is not required for this tool.
2. Paste the original file's SHA256 value below into both fields. Click **Compare hashes**: expect **MATCH**.
3. Replace the second field with the changed file's SHA256 value. Click again: expect **MISMATCH**.

Say: "We compared hashes of the same algorithm. Equality does not authenticate their sources."

## 3. Multi Hash Generator

1. Add `samples/original.txt` to the Evidence Vault.
2. Open Multi Hash Generator and click **Generate hashes**.
3. Compare all five results with the original values below: SHA-1, SHA-256, SHA-384, SHA-512 and MD5.
4. Add `samples/changed.txt` and run again. All five results should change, even though only one byte changed.

Say: "MD5 and SHA-1 are shown for legacy forensic compatibility. Use SHA-256 or stronger for new records; hashes alone do not prove authenticity."

## 4. File Integrity Checker

1. Add `samples/original.txt`. Paste its SHA256 value below as the original baseline.
2. Click **Check integrity**: expect **MATCH**.
3. Add `samples/changed.txt`. Paste the SAME original SHA256 baseline again and run: expect **MISMATCH**.

Say: "The changed copy does not match the baseline. The baseline itself must come from a trustworthy original record."

## 5. Blockchain Verification

1. Ensure your existing server configuration points to the intended Polygon Amoy testnet contract and RPC, and that you are signed in. Do not share your `.env` or private key.
2. Add `samples/original.txt`, open Blockchain Verification and click **Verify on blockchain**.
3. If that hash has never been anchored in that configured contract, expect **NOT FOUND (TESTNET)**. This action does not anchor it.
4. Show **ANCHORED (TESTNET)** only when the tool actually finds a matching real record in your configured contract. If using another already-anchored synthetic file, use its exact original bytes. There is no guaranteed anchored sample in this folder.
5. If configuration, RPC, authentication or the contract is unavailable, show the error honestly. An unavailable error is neither NOT FOUND nor ANCHORED.

Say: "This is a read-only contract lookup on Amoy, not mainnet. A record shows that this hash is stored there; it does not prove authenticity, custody or legal admissibility."

No sample was anchored as part of creating this folder, and no blockchain result is fabricated. A different person could anchor the same bytes later, so NOT FOUND is conditional on current contract state.

## Known-good digests

The values below were computed from the exact committed bytes and checked by automated tests using Node's independent crypto implementation.

### original.txt

```text
MD5: be69369538b000d6b312e7b3f7fcea31
SHA1: 1e9f3b8134dfc2d47d56c50f5373ac65fcce994f
SHA256: f652c4875a5f6edfe7b0d31eca65a7f9b3ff4f1e62d372f5a8f374c54e73a9f2
SHA384: 2ea52d2b89d970f7fe138469ce6497d013a01e0877381896f5547a5d39bb7f42a92df5bf471094a895d90f4e1c70a078
SHA512: 91bb1596b7b80d59bbd98a49b17275da30cb9a6cc6cdaffb0c65f1af05a0ad86c4e665c0af75b738e54710e134730cf3ff2fa7bdc04c847ac2f85650683567ae
```

### changed.txt

```text
MD5: bf8cddcdf249f9f04ca45dc7ecffa2df
SHA1: 830123f0965f20ed5bc3af1169e170f2290c580f
SHA256: c3a482fa9a2441234e30af15b6e4461e72c37a3b44a46ee92c6106cff7cec745
SHA384: f72d7be8b2795d9c497f36769230dd174f756a98bda0ef532d4f9e3f256d7b30ba2e369337b201caba7e6a126329cb73
SHA512: b3c6745c83c0bf35fcfcdcd5e64e253bb07afba5b78bb85061d3b03fb791afebfd4cbb0353dbf7b84515a942fe77ab944146d5a3dc936020b7f6c4dd23abb325
```
