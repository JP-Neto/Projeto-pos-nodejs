import mongoose from "mongoose";
import ProductService from "../service/ProductService.js";
import Product from "../model/Product.js";



export default class ProductController {
    // Define o método estático assíncrono 'create' com os parâmetros 'req' e 'res'
    static async create(req, res) {
        try {
            // Extrai 'name', 'description', 'state' e 'purchased_at' do corpo da requisição (req.body)
            const { name, description, state, purchased_at } = req.body;

            // Chama o método 'create' do 'ProductService' passando os parâmetros necessários e aguarda a criação do produto
            const product = await ProductService.create(req, name, description, state, purchased_at);

            // Retorna uma resposta HTTP 201 (Created) com o produto criado em formato JSON
            res.status(201).json({ product });
        } catch (error) {
            // Se ocorrer um erro, define o status code do erro como o status code do erro lançado ou 500 (Internal Server Error) se não estiver definido
            error.statusCode = error.statusCode || 500;

            // Retorna uma resposta HTTP com o status code do erro e a mensagem de erro em formato JSON
            res.status(error.statusCode).json({ error: error.message });
        }
    }


    // Define o método estático assíncrono 'index' com os parâmetros 'req' e 'res'
    static async index(req, res) {
        try {
            // Extrai 'page' e 'limit' dos parâmetros da query string da requisição (req.query)
            // Define valores padrão para 'page' como 1 e 'limit' como 10, caso não sejam fornecidos
            const { page = 1, limit = 10 } = req.query;

            // Chama o método 'index' do 'ProductService' passando 'page' e 'limit' e aguarda a obtenção dos produtos
            const products = await ProductService.index(page, limit);

            // Retorna uma resposta HTTP 200 (OK) com a lista de produtos em formato JSON
            res.status(200).json({ products });
        } catch (error) {
            // Se ocorrer um erro, define o status code do erro como o status code do erro lançado ou 500 (Internal Server Error) se não estiver definido
            error.statusCode = error.statusCode || 500;

            // Retorna uma resposta HTTP com o status code do erro e a mensagem de erro em formato JSON
            res.status(error.statusCode).json({ error: error.message });
        }
    }


    static async show(req, res) {
        try {
            const { id } = req.params;

            // Verifique se o id é um ObjectId válido
            if (!mongoose.isValidObjectId(id)) {
                return res.status(400).json({ error: 'ID Invalido do Objeto Invalido' });
            }

            // Procure pelo produto no banco de dados e popule os campos owner e received
            const productAchado = await Product.findById(id)
                .populate('owner', null, null, { strictPopulate: false })    // Popula o campo 'owner'
                .populate('received', null, null, { strictPopulate: false }); // Popula o campo 'received'

            // Verifique se o produto foi encontrado
            if (!productAchado) {
                return res.status(404).send();
            }

            // Converta o documento para um objeto JS
            const productObject = productAchado.toObject({ getters: true, versionKey: false });
            productObject.id = productAchado._id; // Adiciona o _id manualmente

            // Retorna o produto encontrado
            return res.status(200).json(productObject);
        } catch (error) {
            error.statusCode = error.statusCode || 500;
            return res.status(error.statusCode).json({ error: error.message });
        }
    }



    static async update(req, res) {
        try {
            const productId = req.params.id;
            const productData = req.body;

            const updatedProduct = await ProductService.update(productId, productData);

            res.status(200).json(updatedProduct);
        } catch (error) {
            let statusCode = 500;
            if (error.message === 'ID do Produto invalido' || error.message === 'Todos os campos são requiridos ') {
                statusCode = 400;
            } else if (error.message === 'Produto não encontrado') {
                statusCode = 404;
            }

            res.status(statusCode).json({ error: error.message });
        }
    }


    static async delete(req, res) {
        try {
            const productId = req.params.id;

            const result = await ProductService.delete(productId);

            // Retorna nenhum conteúdo para o cliente com o status 204
            res.status(204).send();

        } catch (error) {
            error.statusCode = error.statusCode || 500;
            res.status(error.statusCode).json({ error: error.message });
        }
    }

    static async showUserProducts(req, res) {
        try {
            const userId = req.userId; // Obtém o ID do usuário do token JWT
            const products = await ProductService.showUserProducts(userId); // Passa o ID do usuário para a função
            res.status(200).json(products);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }


    static async showRecieverProducts(req, res) {
        try {
            const userId = req.userId;
            const products = await ProductService.showRecieverProducts(userId);

            if (!products.length) {
                return res.status(404).json({ message: 'No products found for this user.' });
            }

        } catch (error) {
            error.statusCode = error.statusCode || 500;
            res.status(error.statusCode).json({ error: error.message });
        }
    }

    static async schedule(req, res) {
        try {
            const productId = req.params.id;
            const { userId } = req; // Obtém o ID do usuário do token JWT

            const message = await ProductService.schedule(productId, userId);

            res.status(200).json({ message });
        } catch (error) {
            error.statusCode = error.statusCode || 500;
            res.status(error.statusCode).json({ error: error.message });
        }
    }

    static async concludeDonation(req, res) {
        try {
            const productId = req.params.id;
            const userId = req.userId;

            const message = await ProductService.concludeDonation(productId, userId);

            res.status(200).json({ message });
        } catch (error) {
            let statusCode = 500;
            if (error.message === 'ID do produto invalido') {
                statusCode = 400;
            } else if (error.message === 'Produto não encontrado' || error.message === 'Produto não está disponível para conclusão de doação' || error.message === 'O usuário não é o proprietário do produto') {
                statusCode = 404;
            }

            res.status(statusCode).json({ error: error.message });
        }
    }
}