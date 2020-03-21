class Init {

    async index (request, response) {

        return response.status(200).json({
            message: {
                status: "Ok",
                date: new Date()
            }
        })
    }
}

export default new Init();

