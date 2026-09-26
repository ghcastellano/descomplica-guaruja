import { z } from "zod";
import { checkMutation } from "@/lib/auth";
import { readBody, failure } from "@/lib/http";
import {
  getAvailability,
  holdBooking,
  acceptBooking,
  cancelBooking,
} from "@/lib/booking";
const token = z.string().regex(/^[A-Za-z0-9_-]{43}$/);
const schema = z.discriminatedUnion("action", [
  z
    .object({ action: z.literal("cancel"), token, bookingId: z.uuid() })
    .strict(),
  z
    .object({
      action: z.literal("availability"),
      token,
      date: z.string(),
      locationId: z.string(),
    })
    .strict(),
  z
    .object({
      action: z.literal("hold"),
      token,
      date: z.string(),
      locationId: z.string(),
      startAt: z.string(),
    })
    .strict(),
  z
    .object({
      action: z.literal("accept"),
      token,
      bookingId: z.uuid(),
      termsAccepted: z.literal(true),
    })
    .strict(),
]);
export async function POST(request: Request) {
  const denied = checkMutation(request, false);
  if (denied) return denied;
  try {
    const input = schema.parse(await readBody(request));
    if (input.action === "cancel")
      return Response.json(
        await cancelBooking(input.token, { bookingId: input.bookingId }),
      );
    if (input.action === "availability")
      return Response.json(
        await getAvailability(input.token, {
          date: input.date,
          locationId: input.locationId,
        }),
      );
    if (input.action === "hold")
      return Response.json(
        await holdBooking(input.token, {
          date: input.date,
          locationId: input.locationId,
          startAt: input.startAt,
        }),
      );
    return Response.json(
      await acceptBooking(input.token, {
        bookingId: input.bookingId,
        termsAccepted: input.termsAccepted,
      }),
    );
  } catch (e) {
    return failure(e);
  }
}
