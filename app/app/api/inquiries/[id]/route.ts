import {checkMutation} from '@/lib/auth';
import {qualifyInquiry} from '@/lib/domain';
import {readBody,failure} from '@/lib/http';
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}) {
 const denied=checkMutation(request);if(denied)return denied;
 try{return Response.json(await qualifyInquiry((await params).id,await readBody(request)));}catch(e){return failure(e);}
}
