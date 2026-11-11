"""Original complete Hello records, never sent or captured from a host."""
from pathlib import Path
import struct,json
u16=lambda n:struct.pack('!H',n)
def ext(t,b):return u16(t)+u16(len(b))+b
def record(kind,body):
 handshake=bytes([kind])+len(body).to_bytes(3,'big')+body
 return (bytes.fromhex('160303')+u16(len(handshake))+handshake).hex()
host=b'demo.example';sni=b'\0'+u16(len(host))+host
extensions=ext(0,u16(len(sni))+sni)+ext(43,bytes.fromhex('0403040303'))+ext(16,bytes.fromhex('0003026832'))
client=bytes.fromhex('0303')+bytes(range(32))+b'\0'+u16(4)+bytes.fromhex('13011302')+bytes.fromhex('0100')+u16(len(extensions))+extensions
extensions=ext(43,bytes.fromhex('0304'))
server=bytes.fromhex('0303')+bytes(range(32,64))+b'\0'+bytes.fromhex('130100')+u16(len(extensions))+extensions
Path('public/samples/network/tls-hello.json').write_text(json.dumps({'recordsHex':[record(1,client),record(2,server)],'certificatesPEM':Path('public/samples/crypto/demo-chain.pem').read_text()},indent=2)+'\n')
