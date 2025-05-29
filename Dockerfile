FROM node:20

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos do projeto Angular para dentro do container
COPY . .

# Instala as dependências
RUN npm install

# Expõe a porta padrão do Angular
EXPOSE 4200

# Comando para iniciar o Angular com live reload
CMD ["npm", "start"]
