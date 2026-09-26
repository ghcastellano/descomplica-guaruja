import {checkMutation} from '@/lib/auth';
import {createInquiry} from '@/lib/domain';
import {readBody,failure} from '@/lib/http';
export async function POST(request:Request) {
 const denied=checkMutation(request);if(denied)return denied;
 try{return Response.json(await createInquiry(await readBody(request)),{status:201});}catch(e){return failure(e);}
}
