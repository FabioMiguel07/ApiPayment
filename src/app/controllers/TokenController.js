import * as Yup from 'yup';
import axios from 'axios';
import Token from "../models/Token";
import Logger from '../../log/LoggerService';

const logger = new Logger('TokenController');

class TokenController {

    //Consulta
    async index(request ,response){

        const { MerchantOrderId } = request.body;

        logger.setLogData(request.body);
        await logger.info("Request Recebido.. GET" , request.body);

        const pedido = await Token.find({
            merchantOrderId: MerchantOrderId
        });

        if (pedido.length === 0){

            await logger.error("Nao foram encontrados dados para a consulta: " + MerchantOrderId);

            return response.status(404).json({
                error: 99,
                message: "Nao foram encontrados dados para a consulta"
            });

        } else {

            const { links: {Href:Url} , customerName, cardToken, createAt } = pedido[0];

            await logger.info("Cliente: ", customerName);
            await logger.info("Token Cartao: ", cardToken);
            await logger.info("URL: ", Url);


            //Buscar Dados
            try {
                const respCielo = await axios.get(
                Url,
               {
                    headers: {
                        MerchantId: process.env.MERCHANT_ID,
                        MerchantKey: process.env.MERCHANT_KEY
                    }
                });

                const {CardNumber, Holder, ExpirationDate } = respCielo.data;

                await logger.info("Numero Cartao Mascarado: " + CardNumber);
                await logger.info("Nome Cartao: " + Holder);
                await logger.info("Data Expiracao: " + ExpirationDate);


                return response.status(200).json({
                    error: 0,
                    message: {
                        MerchantOrderId,
                        CustomerName: customerName,
                        CardToken: cardToken,
                        CardNumber,
                        Holder,
                        ExpirationDate,
                        CreateAt: createAt
                    }

                });

            } catch (e) {
                await logger.error("Nao foram encontrados dados Pagamentos para o Pedido: " + MerchantOrderId);
                return response.status(404).json({
                    error: 99,
                    message: "Nao foram encontrados dados Pagamentos para o Pedido: " + MerchantOrderId,
                    customerName,
                    cardToken,
                    errorDesc: e.message
                 });

            }

        }

    }

    //Criacao
    async store(request, response){

        logger.setLogData(request.body);
        await logger.info("Request Recebido.. POST" , request.body);


        const { MerchantOrderId , CustomerName , CardNumber, Holder, ExpirationDate, Brand } = request.body;

        const schema = Yup.object().shape({
            MerchantOrderId: Yup.string().required(),
            CustomerName: Yup.string().required(),
            CardNumber: Yup.string().required(),
            Holder: Yup.string().required(),
            ExpirationDate: Yup.string().required(),
            Brand: Yup.string().required()
        });

        if (!(await schema.isValid(request.body))) {
            return response.status(400).json({
                error: 99,
                message: 'Falha de Validacao para Recuperar Token'
            });
        }

        await logger.info("API GERAR TOKEN CARTAO.."  + `${process.env.API_CIELO_DEV}/${process.env.URI_TOKEN_CARTAO}`);

        const respCielo = await axios.post(
            `${process.env.API_CIELO_DEV}/${process.env.URI_TOKEN_CARTAO}`,
            {CustomerName , CardNumber, Holder, ExpirationDate, Brand}
            , {
                headers: {
                    MerchantId: process.env.MERCHANT_ID,
                    MerchantKey: process.env.MERCHANT_KEY
                }

            }
        );

        const { CardToken , Links} = respCielo.data;

        console.log('Cartao Tokenizado: ' + CardToken);
        await logger.info("Response CIELO: "  + JSON.stringify(respCielo.data));
        await logger.info("Cartao Tokenizado: "  + CardToken);


        //Cadastro do Cartao Tokenizado
        const token = await Token.create({
            merchantOrderId: MerchantOrderId,
            customerName: CustomerName,
            cardToken: CardToken,
            links: Links,
            createAt: new Date()
        });

        await logger.info("Token Gravado: "  + token._id);

        return response.status(200).json({
            error: 0,
            message: token
        });
    }



}

export default new TokenController();
