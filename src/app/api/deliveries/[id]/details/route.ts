import { DeliveryError, submitDeliveryDetails } from '@/server/deliveries';
import type { DeliveryDetailsRequest, PackageSize } from '@/types/delivery';

const SIZES: PackageSize[] = ['envelope', 'small', 'medium', 'large'];

function validate(body: Partial<DeliveryDetailsRequest>): string | null {
  const { details, departure } = body;
  if (!details || !SIZES.includes(details.size)) return 'Escolha o tamanho do pacote.';
  if (!details.description?.trim()) return 'Descreva o que está enviando.';
  if (details.fragile !== undefined && typeof details.fragile !== 'boolean') return 'Campo "frágil" inválido.';
  if (!details.recipientName?.trim()) return 'Informe quem vai receber.';
  if ((details.recipientPhone?.replace(/\D/g, '').length ?? 0) < 10) return 'Telefone do destinatário inválido.';
  if (departure?.type !== 'now' && !(departure?.type === 'scheduled' && !Number.isNaN(Date.parse(departure.at))))
    return 'Informe quando a entrega deve ser feita.';
  return null;
}

/** "Enviar dados do produto" */
export async function PUT(request: Request, ctx: RouteContext<'/api/deliveries/[id]/details'>) {
  const { id } = await ctx.params;
  const body = (await request.json().catch(() => ({}))) as Partial<DeliveryDetailsRequest>;
  const error = validate(body);
  if (error) return Response.json({ error }, { status: 400 });

  try {
    return Response.json(submitDeliveryDetails(id, body as DeliveryDetailsRequest));
  } catch (err) {
    if (err instanceof DeliveryError) return Response.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
