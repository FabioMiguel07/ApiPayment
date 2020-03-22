import {format, parseISO} from 'date-fns';
import axios from 'axios';
import Logger from '../../log/LoggerService';

const logger = new Logger('VendaController');

class VendaController {

    async index(request ,response){

          logger.setLogData(request.query);
          await logger.info("Request Recebido.. GET" , request.query);
          const { PaymentId } = request.query;

          try {

            await logger.info('API TOKEN Consulta: ' + `${process.env.API_CIELO_CONSULTA_DEV}/${process.env.URI_VENDA_CARTAO}` + PaymentId);

            const venda = await axios.get(
            `${process.env.API_CIELO_CONSULTA_DEV}/${process.env.URI_VENDA_CARTAO}` +
                PaymentId
            , {
                headers: {
                    MerchantId: process.env.MERCHANT_ID,
                    MerchantKey: process.env.MERCHANT_KEY
                }

            });

            await logger.info("Response Cielo: " + JSON.stringify(venda.data)) ;

            return response.status(200).json({
                error: 0,
                message: venda.data
            });

        } catch (e) {

            await logger.error("Erro ao Consultar Venda" + e.message);
            return response.status(500).json({
                error: 99,
                message: "Erro ao Consultar Venda",
                errorDesc: e.message
            });
        }

    }

    async store(request ,response){


        logger.setLogData(request.body);

        await logger.info("Request Recebido.. POST" , request.body);
        const { MerchantOrderId , Payment: {Amount}, Payment: {CreditCard: {CardToken}}} = request.body;

        await logger.info("Valor da Compra" , Amount);
        await logger.info("Cartao Tokenizado" , CardToken);


        if (!CardToken) {
            await logger.error('Token do Cartao é Obrigatorio ');
            return response.status(400).json({
                error: 99,
                message: 'Token do Cartao é Obrigatorio '
            });
        }

        if (!MerchantOrderId){
            await logger.error("Numero do Pedido é Obrigatório ");
            return response.status(400).json({
                error: 99,
                message: "Numero do Pedido é Obrigatório "
            })
        }

        if (Amount < 0 || Amount === 0){
            await logger.error("Valor de venda deve ser maior que R$ 0.00 ");
            return response.status(400).json({
                error: 99,
                message: "Valor de venda deve ser maior que R$ 0.00 "
            })
        }

        await logger.info('API TOKEN VENDA : ' + `${process.env.API_CIELO_DEV}/${process.env.URI_VENDA_CARTAO}`);

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
            await logger.info("Response Cielo: " + JSON.stringify(respCielo.data));
            return response.status(200).json({
                error: 0,
                message: respCielo.data
            });

        } catch (e) {
            await logger.error("Erro ao Efetivar Venda" + e.message);
            return response.status(500).json({
                error: 99,
                message: "Erro ao Efetivar Venda",
                errorDesc: e.message
            });
        }


    }

    async update(request ,response){

         const { PaymentId } = request.body;

         logger.setLogData(request.body);
         await logger.info("Request Recebido Cancelamento.. PUT: " , request.body);

         try {

            await logger.info("Recuperar os dados da Compra pelo Id de Pagamento: " + PaymentId);
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


            await logger.info("Valor Referente a Venda R$ " + Amount);


            if ( !AuthorizationCode ) {
                await logger.error("Compra nao foi autorizada " + " '" + ReturnMessage +  "'"  + ". Cancelamento Indisponivel.");
                return response.status(400).json({
                    error: 99,
                    message: " '" + ReturnMessage +  "'" + ". Cancelamento Indisponivel."
                });
            }
            if (Status === 10 ) {
                await logger.error("Pagamento ja foi Cancelado em " + format(parseISO(VoidedDate), "dd-MM-yyyy 'as' HH:mm:ss"));
                return response.status(400).json({
                    error: 99,
                    message: "Pagamento ja foi Cancelado em " + format(parseISO(VoidedDate), "dd-MM-yyyy 'as' HH:mm:ss")
                });
            }

            await logger.info("Status da Venda: " + Status);
            await logger.info("Codigo Autorizador: " + AuthorizationCode);
            await logger.info("Efetivando Cancelamento...");


            //Efetivando o cancelamento
            const url = `${process.env.API_CIELO_DEV}/${process.env.URI_CANCELAMENTO}`;
            const urlCancelamento = url.replace("{}", PaymentId).replace("$", Amount);

            await logger.info('API TOKEN Cancelamento: ' + urlCancelamento);

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

                await logger.info('Response Cielo Cancelamento: ' + JSON.stringify(cancelamento.data));

                return response.status(200).json({
                    error: 0,
                    message: cancelamento.data
                });

            } else {
                await logger.error("Erro ao Cancelar Venda." + e.message);
                return response.status(500).json({
                    message: "Erro ao Cancelar Venda.",
                    errorDesc: e.message,
                    error: 99
                });
            }


        } catch (e) {
            await logger.error("Erro ao Consultar Venda. Nao é Possivel o Cancelamento. Verifique o PaymentId" + e.message);
            return response.status(500).json({
                message: "Erro ao Consultar Venda. Nao é Possivel o Cancelamento. Verifique o PaymentId",
                errorDesc: e,
                error: 99
           });
        }

    }

}

export default new VendaController();

