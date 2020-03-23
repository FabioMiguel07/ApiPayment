class Init {

    async index (request, response) {

        return response.status(200).json({
            message: {
                status: "Ambiente: " + process.env.MODE_ENV,
                versao: "Versao: " + process.env.APP_VERSAO,
                date: new Date()
            }
        })
    }
}

export default new Init();

