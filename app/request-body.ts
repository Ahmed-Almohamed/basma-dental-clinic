export class BodyTooLarge extends Error{}
export async function boundedBody(request:Request,max:number){if(Number(request.headers.get('content-length')||0)>max)throw new BodyTooLarge();const reader=request.body?.getReader();if(!reader)return new Uint8Array();let size=0;const chunks:Uint8Array[]=[];while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();throw new BodyTooLarge()}chunks.push(value)}const out=new Uint8Array(size);let offset=0;for(const chunk of chunks){out.set(chunk,offset);offset+=chunk.length}return out;}

