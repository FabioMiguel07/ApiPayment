import * as Yup from 'yup';
import axios from 'axios';
import Token from "../models/Token";
import Logger from '../../log/LoggerService'
import Cryptr from 'cryptr';

const logger = new Logger('TokenController');
const crypt = new Cryptr(process.env.APP_SECRET);

class TokenController {

    //Consulta
    async index(request ,response){

        const { MerchantOrderId } = request.params;

        logger.setLogData(request.params.MerchantOrderId);
        await logger.info("Request Recebido.. GET" , request.params.MerchantOrderId);

        const pedido = await Token.find({
            merchantOrderId: MerchantOrderId
        });

        if (pedido.length === 0){

            return response.status(404).json({
                error: 99,
                message: "Nao foram encontrados dados para a consulta"
            });

        } else {

            const { customerName, cardToken, createAt } = pedido[0];

            await logger.info("Cliente: ", customerName);
            await logger.info("Token Cartao: ", cardToken);

            //Recupera URL de Desenvolvimento ou Producao para acesso a Cielo
            const URLCielo = process.env.MODE_ENV === 'Producao' ?
                             process.env.API_CIELO_CONSULTA :
                             process.env.API_CIELO_CONSULTA_DEV;

            const Url = URLCielo + process.env.URI_TOKEN_CARTAO + crypt.decrypt(cardToken);
            await logger.info("URL Consulta Cartao: ", Url);

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
                        CardToken: crypt.decrypt(cardToken),
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
                    CardNumber: crypt.decrypt(cardToken),
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

        //Recupera URL de Desenvolvimento ou Producao para acesso a Cielo
        const URLCielo = process.env.MODE_ENV === 'Producao' ? process.env.API_CIELO : process.env.API_CIELO_DEV;

        await logger.info("API GERAR TOKEN CARTAO.."  + URLCielo + process.env.URI_TOKEN_CARTAO);

        const respCielo = await axios.post(
            URLCielo + process.env.URI_TOKEN_CARTAO,
            {CustomerName , CardNumber, Holder, ExpirationDate, Brand}
            , {
                headers: {
                    MerchantId: process.env.MERCHANT_ID,
                    MerchantKey: process.env.MERCHANT_KEY
                }

            }
        );

        const { CardToken } = respCielo.data;

        await logger.info("Response CIELO: "  + JSON.stringify(respCielo.data));
        await logger.info("Cartao Tokenizado: "  + CardToken);

        const cardTokenCript = crypt.encrypt(CardToken);
        await logger.info("Cartao Criptografado: " + cardTokenCript);



        //Cadastro do Cartao Tokenizado
        const token = await Token.create({
            merchantOrderId: MerchantOrderId,
            customerName: CustomerName,
            cardToken: cardTokenCript,
            createAt: new Date()
        });

        token.cardToken = crypt.decrypt(token.cardToken);
        await logger.info("Token Gravado: "  + token._id);

        return response.status(200).json({
            error: 0,
            message: token
        });
    }



}

export default new TokenController();
