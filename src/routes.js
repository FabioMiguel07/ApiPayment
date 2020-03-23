import { Router } from 'express';
import TokenController from "./app/controllers/TokenController";
import VendaController from "./app/controllers/VendaController";
import Init from "./app/controllers/Init";


const routes = new Router();
const URI = process.env.MODE_ENV === 'Producao' ? "" : "/dev";

routes.post(`${URI}/token`, TokenController.store);
routes.get(`${URI}/token/:MerchantOrderId`, TokenController.index);

routes.post(`${URI}/venda`, VendaController.store);
routes.get(`${URI}/venda/:PaymentId`, VendaController.index);
routes.put(`${URI}/venda/:PaymentId`, VendaController.update);

routes.get(`${URI}`, Init.index);


export default routes;
