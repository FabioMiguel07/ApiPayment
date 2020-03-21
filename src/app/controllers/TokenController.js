import * as Yup from 'yup';
import axios from 'axios';
import Token from "../models/Token";


class TokenController {

    //Consulta
    async index(request ,response){

        const { MerchantOrderId } = request.body;

        const pedido = await Token.find({
            merchantOrderId: MerchantOrderId
        });

        if (pedido.length === 0){
            return response.status(404).json({
                error: 99,
                message: "Nao foram encontrados dados para a consulta"
            });

        } else {

            const { links: {Href:Url} , customerName, cardToken, createAt } = pedido[0];

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

        //Recuperando informacoes do body
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

        console.log('API TOKEN: ' + `${process.env.API_CIELO_DEV}/${process.env.URI_TOKEN_CARTAO}`);

        //Recuperando informacoes do body
        //const { CustomerName , CardNumber, Holder, ExpirationDate, Brand } = request.body;

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

        //Cadastro do Cartao Tokenizado
        const token = await Token.create({
            merchantOrderId: MerchantOrderId,
            customerName: CustomerName,
            cardToken: CardToken,
            links: Links,
            createAt: new Date()
        });

        return response.status(200).json({
            error: 0,
            message: token
        });
    }



}

export default new TokenController();
