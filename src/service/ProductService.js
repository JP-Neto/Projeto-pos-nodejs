import mongoose from "mongoose";
import Product from "../model/Product.js"
import UserService from "./UserService.js";
import User from "../model/User.js";


export default class ProductService {

    // Define o método estático assíncrono 'create' com os parâmetros 'req', 'name', 'description', 'state' e 'purchased_at'
    static async create(req, name, description, state, purchased_at) {
        // Obtém o usuário atual através do serviço de usuários usando as informações da requisição
        const user = await UserService.getUser(req);

        // Inicializa um array vazio para armazenar as imagens
        let images = [];
        // Verifica se há arquivos na requisição
        if (req.files) {
            // Se houver, armazena-os no array 'images'
            images = req.files;
        }

        // Define a variável 'available' como true para indicar que o produto está disponível
        const available = true;

        // Verifica se o nome do produto foi fornecido
        if (!name) {
            // Se não, cria um novo erro com a mensagem "O nome é obrigatório."
            const error = new Error("O nome é obrigatório.");
            // Define o status code do erro para 422 (Unprocessable Entity)
            error.statusCode = 422;
            // Lança o erro, interrompendo a execução do código
            throw error;
        }

        // Verifica se a descrição do produto foi fornecida
        if (!description) {
            // Se não, cria um novo erro com a mensagem "A descrição é obrigatória."
            const error = new Error("A descrição é obrigatória.");
            // Define o status code do erro para 422 (Unprocessable Entity)
            error.statusCode = 422;
            // Lança o erro, interrompendo a execução do código
            throw error;
        }

        // Verifica se o estado do produto foi fornecido
        if (!state) {
            // Se não, cria um novo erro com a mensagem "O estado é obrigatório."
            const error = new Error("O estado é obrigatório.");
            // Define o status code do erro para 422 (Unprocessable Entity)
            error.statusCode = 422;
            // Lança o erro, interrompendo a execução do código
            throw error;
        }

        // Verifica se a data de compra do produto foi fornecida
        if (!purchased_at) {
            // Se não, cria um novo erro com a mensagem "A data de compra é obrigatória."
            const error = new Error("A data de compra é obrigatória.");
            // Define o status code do erro para 422 (Unprocessable Entity)
            error.statusCode = 422;
            // Lança o erro, interrompendo a execução do código
            throw error;
        }

        // Verifica se pelo menos uma imagem foi fornecida
        if (images.length === 0) {
            // Se não, cria um novo erro com a mensagem "A imagem é obrigatória."
            const error = new Error("A imagem é obrigatória.");
            // Define o status code do erro para 422 (Unprocessable Entity)
            error.statusCode = 422;
            // Lança o erro, interrompendo a execução do código
            throw error;
        }

        // Cria uma nova instância de Product com os dados fornecidos, incluindo o ID do proprietário (user._id) e um array vazio de imagens
        const product = new Product({ name, description, state, owner: user._id, available, images: [] });

        // Itera sobre o array de imagens e adiciona cada filename ao array de imagens do produto
        images.map((image) => product.images.push(image.filename));

        // Salva a nova instância de produto no banco de dados e aguarda a conclusão do processo
        const productSaved = await product.save();

        // Retorna o produto salvo como resultado da função
        return productSaved;
    }

    // Define o método estático assíncrono 'index' com os parâmetros 'page' e 'limit'
    static async index(page, limit) {
        // Busca todos os produtos no banco de dados, ordenados pela data de criação em ordem decrescente
        // Limita o número de produtos retornados ao valor de 'limit'
        // Pula um número de produtos calculado pela fórmula '(page-1) * limit' para paginação
        // Popula o campo 'owner' do produto, excluindo o campo 'password'
        // Popula também o campo 'reciever' do produto
        const products = await Product.find()
            .sort("-createdAt")
            .limit(limit)
            .skip((page - 1) * limit)
            .populate({ path: "owner", select: "-password" })
            .populate("reciever");

        // Retorna a lista de produtos encontrados
        return products;
    }


    static async show(productId) {
        try {
            // Busca o produto pelo ID fornecido
            const product = await Product.findById(productId)
                .populate('owner') // Popula o campo 'owner'
                .populate('receiver'); // Popula o campo 'receiver'

            return product; // Retorna o produto encontrado
        } catch (error) {
            // Se ocorrer um erro, lança o erro para ser tratado no controlador
            throw error;
        }
    }


    static async update(productId, productData) {
        // Verifica se o ID do produto é válido
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            throw new Error('Invalid product ID');
        }

        // Valida os campos do produto
        const { name, description, state, purchased_at, images } = productData;
        if (!name || !description || !state || !purchased_at || !images) {
            throw new Error('Todos os campos são requiridos');
        }

        // Busca o produto pelo ID
        const product = await Product.findById(productId);
        if (!product) {
            throw new Error('Produto não encontrado');
        }

        // Atualiza o produto
        product.name = name;
        product.description = description;
        product.state = state;
        product.purchased_at = purchased_at;
        product.images = images;

        const updatedProduct = await product.save();
        return updatedProduct;
    }


    static async delete(productId) {
        // Valida se é um ID válido
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            throw new Error('Invalid product ID');
        }

        // Busca o produto pelo ID no banco de dados
        const product = await Product.findById(productId);

        // Verifica se o produto foi encontrado
        if (!product) {
            throw new Error('Produto não encontrado');
        }

        // Deleta o produto
        await Product.findByIdAndDelete(productId);
    }




    static async showUserProducts(userId) {
        try {
            // Busca os produtos associados ao usuário com o ID fornecido
            const products = await Product.find({ owner: userId }).populate('owner').populate('reciever');


            // Retorna os produtos encontrados
            return products;
        } catch (error) {
            // Se ocorrer um erro, você pode tratar aqui ou repassar para o controlador
            throw error;
        }
    }



    static async showRecieverProducts(userId) {
        try {
            const products = await Product.find({ reciever: userId });
            return products;
        } catch (error) {
            throw new Error('Erro ao buscar produtos');
        }

    }


    static async schedule(productId, userId) {

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            throw new Error('ID do Produto Inválido');
        }

        // Busca o produto pelo ID no banco de dados
        const product = await Product.findById(productId);

        // Verifica se o produto foi encontrado
        if (!product) {
            throw new Error('Produto não encontrado');
        }

        // Verifica se o produto ainda está disponível
        if (!product.available) {
            throw new Error('Produto não está disponível para agendamento');
        }

        // Obtém o usuário pelo ID
        const user = await User.findById(userId);

        // Verifica se o usuário é o proprietário do produto
        if (!product.owner.equals(user._id)) {
            throw new Error('O usuário não é o proprietário do produto');
        }

        // Altera o atributo receiver do produto para o ID do usuário
        Product.receiver = userId;
        await product.save();

        // Retorna a mensagem de sucesso
        return `A visita foi agendada com sucesso, entre em contato com o usuario`;
    }


    static async concludeDonation(productId, userId) {
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            throw new Error('ID do Produto Inválido');
        }

        // Busca o produto pelo ID no banco de dados
        const product = await Product.findById(productId);

        // Verifica se o produto foi encontrado
        if (!product) {
            throw new Error('Produto não encontrado');
        }

        // Verifica se o produto ainda está disponível
        if (!product.available) {
            throw new Error('Produto não está disponível para conclusão da doação');
        }

        // Obtém o usuário pelo ID
        const user = await User.findById(userId);

        // Verifica se o usuário é o proprietário do produto
        if (!product.owner.equals(user._id)) {
            throw new Error('O usuário não é o proprietário do produto');
        }

        // Altera o atributo available do produto para false
        product.available = false;

        // Altera o valor do atributo donated_at para a data atual
        product.donated_at = new Date();

        // Salva as alterações do produto no banco de dados
        await product.save();

        // Retorna a mensagem de sucesso
        return 'Doação concluída com Sucesso.';
    }

}
