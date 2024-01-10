var processosData = [];


function adicionarProcessos() {
    document.getElementById('adicionarProcessos').disabled = true
    document.getElementById('restaurar').disabled = true

    var num_processos = parseInt(document.getElementById('num_processos').value);
    var quantum = parseInt(document.getElementById('qtd_quantum').value);
    var sobrecarga = parseInt(document.getElementById('sobrecarga').value);

    var processosDetailsHTML = '';

    for (var i = 0; i < num_processos; i++) {
        processosData.push({
            "quantum": quantum,
            "sobrecarga": sobrecarga,
            "deadline": 0,
            "tempo_chegada": 0,
            "tempo_execucao": 0
        });

        var label = String.fromCharCode(65 + i);
        processosDetailsHTML += `
            <div class="row">
                <div class="col">
                    <h3>Processo ${label}</h3>
                </div>
                <div class="col">
                    <label for="deadline_time_${i}">Deadline:</label>
                    <input type="number" id="deadline_time_${i}" min="0" value="10" class="form-control">
                </div>
                <div class="col">
                    <label for="time_chegada_${i}">Tempo de chegada:</label>
                    <input type="number" id="time_chegada_${i}" min="0" value="0" class="form-control">
                </div>
                <div class="col">
                    <label for="execucao_tempo_${i}">Tempo de execução:</label>
                    <input type="number" id="execucao_tempo_${i}" min="1" value="4" class="form-control">
                </div>
                <div class="col">
                    <label for="numero_paginas_${i}">N° de Páginas:</label>
                    <input type="number" id="numero_paginas_${i}" min="1" max="10" value="2" class="form-control">
                </div>
            </div>
        `;
    }

    guardarDadosIniciais()

    document.getElementById('processosDetails').innerHTML = processosDetailsHTML;

    document.getElementById('num_processos').disabled = true;
    document.getElementById('qtd_quantum').disabled = true;
    document.getElementById('sobrecarga').disabled = true;

    document.getElementById('processos').style.display = 'block';


}


async function executar(algoritmo) {
    var quantum = parseInt(document.getElementById('qtd_quantum').value);
    var sobrecarga = parseInt(document.getElementById('sobrecarga').value);
    var data = {
        "sobrecarga": sobrecarga,
        "quantum": quantum,
        "processos": [],
        "grafico": []
    };

    var num_processos = processosData.length;

    for (var i = 0; i < num_processos; i++) {
        var deadline = parseInt(document.getElementById(`deadline_time_${i}`).value);
        var chegada = parseInt(document.getElementById(`time_chegada_${i}`).value);
        var execucao = parseInt(document.getElementById(`execucao_tempo_${i}`).value);
        var paginas = parseInt(document.getElementById(`numero_paginas_${i}`).value);

        processosData[i].deadline = deadline;
        processosData[i].tempo_chegada = chegada;
        processosData[i].tempo_execucao = execucao;
        processosData[i].paginas = paginas
    }

    localStorage.setItem('processosArray', JSON.stringify(processosData))

    for (var i = 0; i < num_processos; i++) {
        var label = String.fromCharCode(65 + i);
        var atributos = {
            "label": label,
            "tempo_de_chegada": processosData[i].tempo_chegada,
            "tempo_de_execucao": processosData[i].tempo_execucao,
            "paginas": processosData[i].paginas
        }
        if (algoritmo === 'EDF') {
            atributos["deadline"] = processosData[i].deadline
        }

        data.processos.push(atributos)
    }

    let resultado = data
    escalonador = new Escalonador(data)

    if (algoritmo === 'FIFO') {
        resultado = await escalonador.fifo(data.processos);
    } else if (algoritmo === 'SJF') {
        resultado = escalonador.sjf();
    } else if (algoritmo === 'Round Robin') {
        resultado = escalonador.roundrobin();
    } else if (algoritmo === 'EDF') {
        resultado = escalonador.edf();
    }

    document.getElementById('fifo').disabled = true
    document.getElementById('rr').disabled = true
    document.getElementById('sjf').disabled = true
    document.getElementById('edf').disabled = true


    let tempo_medio = resultado.tempo_medio.toFixed(2);
    document.getElementById('tempo-medio').innerHTML = `<h3>Turnaround médio (${algoritmo}) = ${tempo_medio}</h3>`;


    var algoritmoTrocaPaginas = document.getElementById('algoritmo_troca').value;


    let memoria = new Memoria(resultado.processos)

    try {
        memoria.criarMemoriaRam()
        document.getElementById('nome-algoritmo').innerHTML = `Troca de páginas: ${algoritmoTrocaPaginas}`

        memoria.criarDisco()
        document.getElementById('titulo-disco').innerHTML = 'DISCO'
        await memoria.adicionarPaginasNoDisco(resultado.processos)
    } catch (error) {
        console.log('Erro na criação das memórias')
    }

    Grafico.gerarLabels(algoritmo)
    await Grafico.gerarGrafico(resultado, algoritmoTrocaPaginas, memoria)
}




/******************************************************************************
 *  
 *                              Restaurar valores
 * 
 ******************************************************************************/

function recarregarPagina() {
    location.reload()
    alert("Clique em 'Restaurar' para recuperar valores anteriores")
}

function guardarDadosIniciais() {
    localStorage.clear()
    let num_processos = document.getElementById("num_processos").value;
    let qtd_quantum = document.getElementById("qtd_quantum").value;
    let sobrecarga = document.getElementById("sobrecarga").value;
    let algoritmo_troca = document.getElementById("algoritmo_troca").value;

    localStorage.setItem("num_processos", num_processos);
    localStorage.setItem("qtd_quantum", qtd_quantum);
    localStorage.setItem("sobrecarga", sobrecarga);
    localStorage.setItem("algoritmo_troca", algoritmo_troca);
}

function restaurarProcessosAnteriores() {
    let num_processos_storage = localStorage.getItem("num_processos");
    let qtd_quantum_storage = localStorage.getItem("qtd_quantum");
    let sobrecarga_storage = localStorage.getItem("sobrecarga");
    let algoritmo_troca_storage = localStorage.getItem("algoritmo_troca");

    if (num_processos_storage !== null) {
        document.getElementById("num_processos").value = num_processos_storage;
    }
    if (qtd_quantum_storage !== null) {
        document.getElementById("qtd_quantum").value = qtd_quantum_storage;
    }
    if (sobrecarga_storage !== null) {
        document.getElementById("sobrecarga").value = sobrecarga_storage;
    }
    if (algoritmo_troca_storage !== null) {
        document.getElementById("algoritmo_troca").value = algoritmo_troca_storage;
    }

    let processosAnteriores = localStorage.getItem('processosArray')

    if (processosAnteriores == null) {
        alert('Não há valores para restaurar. Adicione novos processos')
        document.getElementById('restaurar').disabled = true
        return
    }

    document.getElementById('restaurar').disabled = true
    document.getElementById('adicionarProcessos').disabled = true
    

    processosAnteriores = JSON.parse(processosAnteriores);
    num_processos = processosAnteriores.length
    var quantum = parseInt(document.getElementById('qtd_quantum').value);
    var sobrecarga = parseInt(document.getElementById('sobrecarga').value);
    processosData = []
    let processosDetailsHTML = ''

    for (const [i, processo] of processosAnteriores.entries()) {
        processosData.push({
            "quantum": quantum,
            "sobrecarga": sobrecarga,
            "deadline": 0,
            "tempo_chegada": 0,
            "tempo_execucao": 0
        });

        var label = String.fromCharCode(65 + i);
        processosDetailsHTML += `
            <div class="row">
                <div class="col">
                    <h3>Processo ${label}</h3>
                </div>
                <div class="col">
                    <label for="deadline_time_${i}">Deadline:</label>
                    <input type="number" id="deadline_time_${i}" min="0" value="${processo['deadline']}" class="form-control">
                </div>
                <div class="col">
                    <label for="time_chegada_${i}">Tempo de chegada:</label>
                    <input type="number" id="time_chegada_${i}" min="0" value="${processo['tempo_chegada']}" class="form-control">
                </div>
                <div class="col">
                    <label for="execucao_tempo_${i}">Tempo de execução:</label>
                    <input type="number" id="execucao_tempo_${i}" min="1" value="${processo['tempo_execucao']}" class="form-control">
                </div>
                <div class="col">
                    <label for="numero_paginas_${i}">N° de Páginas:</label>
                    <input type="number" id="numero_paginas_${i}" min="1" max="10" value="${processo['paginas']}" class="form-control">
                </div>
            </div>
        `;
    } 


    document.getElementById('processosDetails').innerHTML = processosDetailsHTML;

    document.getElementById('num_processos').disabled = true;
    document.getElementById('qtd_quantum').disabled = true;
    document.getElementById('sobrecarga').disabled = true;
    document.getElementById('processos').style.display = 'block';
}