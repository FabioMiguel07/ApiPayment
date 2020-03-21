import {format, parseISO} from 'date-fns';
import axios from 'axios';

class VendaController {

    async index(request ,response){

          const { PaymentId } = request.body;

          try {

            console.log('API TOKEN Consulta: ' + `${process.env.API_CIELO_CONSULTA_DEV}/${process.env.URI_VENDA_CARTAO}` + PaymentId );
            const venda = await axios.get(
            `${process.env.API_CIELO_CONSULTA_DEV}/${process.env.URI_VENDA_CARTAO}` +
                PaymentId
            , {
                headers: {
                    MerchantId: process.env.MERCHANT_ID,
                    MerchantKey: process.env.MERCHANT_KEY
                }

            });


            return response.status(200).json({
                error: 0,
                message: venda.data
            });

        } catch (e) {
            return response.status(500).json({
                error: 99,
                message: "Erro ao Consultar Venda",
                errorDesc: e.message
            });
        }

    }

    async store(request ,response){

        //Recuperando informacoes do body

        //const { links: {Href:Url} , customerName, cardToken, createAt } = pedido[0];

        const { MerchantOrderId , Payment: {Amount}, Payment: {CreditCard: {CardToken}}} = request.body;


        if (!CardToken) {
            return response.status(400).json({
                error: 99,
                message: 'Token do Cartao é Obrigatorio '
            });
        }

        if (!MerchantOrderId){
            response.status(400).json({
                error: 99,
                message: "Numero do Pedido é Obrigatório "
            })
        }

        if (Amount < 0 || Amount === 0){
            response.status(400).json({
                error: 99,
                message: "Valor de venda deve ser maior que R$ 0.00 "
            })
        }


        console.log('API TOKEN : ' + `${process.env.API_CIELO_DEV}/${process.env.URI_VENDA_CARTAO}`);

        try {
            const respCielo = await axios.post(
            `${process.env.API_CIELO_DEV}/${process.env.URI_VENDA_CARTAO}`,
            request.body
            , {
                headers: {
                    MerchantId: process.env.MERCHANT_ID,
                    MerchantKey: process.env.MERCHANT_KEY
                }

            });
            return response.status(200).json({
                error: 0,
                message: respCielo.data
            });

        } catch (e) {
            return response.status(500).json({
                error: 99,
                message: "Erro ao Efetivar Venda",
                errorDesc: e.message
            });
        }


    }

    async update(request ,response){

         const { PaymentId } = request.body;

         try {

            const venda = await axios.get(
            `${process.env.API_CIELO_CONSULTA_DEV}/${process.env.URI_VENDA_CARTAO}` +
                PaymentId
            , {
                headers: {
                    MerchantId: process.env.MERCHANT_ID,
                    MerchantKey: process.env.MERCHANT_KEY
                }

            });

            const { Payment: { Amount } , Payment: { Status }, Payment: {VoidedDate}
                  , Payment: { ReturnMessage } , Payment: {AuthorizationCode} } = venda.data;

            if ( !AuthorizationCode ) {
                return response.status(400).json({
                    error: 99,
                    message: " '" + ReturnMessage +  "'" + ". Cancelamento Indisponivel."
                });
            }
            if (Status === 10 ) {
                return response.status(400).json({
                     error: 99,
                    message: "Pagamento ja foi Cancelado em " + format(parseISO(VoidedDate), "dd-MM-yyyy 'as' HH:mm:ss")
                });
            }



            //Efetivando o cancelamento
            const url = `${process.env.API_CIELO_DEV}/${process.env.URI_CANCELAMENTO}`;
            const urlCancelamento = url.replace("{}", PaymentId).replace("$", Amount);
            console.log('API TOKEN Cancelamento: ' + urlCancelamento);


            if (Amount > 0 ) {
                const cancelamento = await axios.put(
                    urlCancelamento
                    , null
                    , {
                        headers: {
                        MerchantId: process.env.MERCHANT_ID,
                        MerchantKey: process.env.MERCHANT_KEY
                    }
                });

                return response.status(200).json({
                    error: 0,
                    message: cancelamento.data
                });

            } else {
                return response.status(500).json({
                    message: "Erro ao Cancelar Venda.",
                    errorDesc: e.message,
                    error: 99
                });
            }


        } catch (e) {
            return response.status(500).json({
                message: "Erro ao Consultar Venda. Nao é Possivel o Cancelamento",
                errorDesc: e,
                error: 99
            });
        }




    }
    
}

export default new VendaController();

