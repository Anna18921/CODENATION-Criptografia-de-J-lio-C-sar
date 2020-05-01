require("dotenv").config();
const request = require("request");
const fs = require("fs");
const crypto = require("crypto");
const { join } = require("path");

request(process.env.API_REQUISICAO, function (error, response, result) {
  if (error) {
    console.error("error:", error);
  }
  const data = result;
  fs.writeFile("answer.json", data, (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log("Arquivo Salvo com Sucesso");
    }
  });
  decodificar();
});

const decodificar = () => {
  fs.readFile("answer.json", (err, data) => {
    if (err) {
      throw err;
    }
    const json = JSON.parse(data);
    const result = decifrarFrase(json.cifrado, json.numero_casas);
    json["decifrado"] = result;
    const resumoSha1 = resumo_criptografico(result);
    json["resumo_criptografico"] = resumoSha1;
    fs.writeFile("answer.json", JSON.stringify(json), (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Texto Decifrado com Sucesso.");
      }
    });
  });

  enviarCifraCezar();
};

const decifrarFrase = (textoCifrado, numero) => {
  const numero_casas = numero < 0 ? 26 : numero;
  let decifrado = "";

  for (let i = 0; i < textoCifrado.length; i++) {
    const codeAsc = textoCifrado.charCodeAt(i);
    let letra = "";
    if ((codeAsc >= 48 && codeAsc <= 57) || codeAsc == 46) {
      letra = String.fromCharCode(codeAsc);
    } else {
      if (codeAsc === 32) {
        letra = " ";
      } else {
        if (codeAsc >= 65 && codeAsc <= 90) {
          // Na tabela Ascii o decimal 65 a 90 corresponde as Letras Maiúsculas ex: ABCDEFG...
          letra = String.fromCharCode(
            ((codeAsc - numero_casas + 65) % 26) + 65
          );
          console.log(letra);
        } else {
          if (codeAsc >= 97 && codeAsc <= 122) {
            // Na tabela Ascii o decimal 97 a 122 corresponde as Letras Minúsculas ex: abcdefg...
            if (codeAsc - numero_casas < 97) {
              letra = String.fromCharCode(
                codeAsc - numero_casas + 122 - 97 + 1
              );
            } else {
              letra = String.fromCharCode(codeAsc - numero_casas);
            }
          }
        }
      }
    }
    decifrado += letra.toLowerCase();
  }
  return decifrado;
};

const resumo_criptografico = (decifrado) => {
  // é necessário npm install crypto
  const resumo = crypto.createHash("sha1").update(decifrado).digest("hex");
  return resumo;
};
const newAnswer = fs.createReadStream(join(__dirname, "answer.json"));

function enviarCifraCezar() {
  request(
    {
      method: "POST",
      url: process.env.API_SUBMIT,
      headers: {
        "Content-Type": "multipart/form-data",
      },
      formData: {
        answer: newAnswer,
      },
    },
    (err, res, body) => {
      if (err) {
        return console.error("Falha ao enviar arquivo:", err);
      }
      console.log("Arquivo Enviado com Sucesso!  Resposta do Servidor:", body);
    }
  );
}
