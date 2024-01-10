class Grafico {

    static async gerarGrafico(resultado, algoritmoTrocaPaginas, memoria) {
        
        let grafico = resultado.grafico
        let labels = []
        for (const acao of grafico) {
            labels.push(acao['label'])
        }
        labels = [...new Set(labels)];

        let larguraDaUltimaExecucao = {}
        let chartContainer = document.getElementById('chartContainer');
        chartContainer.innerHTML = "";
        for (let label of labels) {
            larguraDaUltimaExecucao[label] = 0
            let divProcesso = document.createElement('div')
            divProcesso.classList.add('process-bar')

            let processLabel = document.createElement('div');
            processLabel.classList.add('process-label');
            processLabel.innerText = label;
            processLabel.id = label + "label"

            let containerAcoes = document.createElement('div')
            containerAcoes.classList.add('bar-container')
            containerAcoes.id = label

            divProcesso.appendChild(processLabel)
            divProcesso.appendChild(containerAcoes)
            chartContainer.appendChild(divProcesso)
        }


        let ultimoProcesso = null
        let largura = 0
        let timeout = 1000
        for (const [i, acao] of grafico.entries()) {
            let containerAcoes = document.getElementById(acao['label'])
            const bar = document.createElement('div');
            bar.classList.add('bar');

            if (acao['status'] === 'executando') {
                bar.classList.add('executing');
            } else if (acao['status'] === 'sobrecarga') {
                bar.classList.add('overload');
            }

            if (acao['tempo'] >= acao['tempo_estouro_deadline']) {
                bar.innerHTML = acao['tempo'] + ' X'
            } else {
                bar.innerHTML = acao['tempo']
            }
            

            bar.style.width = '40px';
            
            await setTimeout(() => {
                try {
                    let processoEstaNaRam = memoria.verificaSeProcessoEstaCompletamenteNaRam(acao['label'])
                    if (processoEstaNaRam == false) {
                        memoria.colocarPaginasDoProcessoNaRam(algoritmoTrocaPaginas, acao['label'])
                    }
                } catch (error) {
                    console.log(error)
                    console.log('Erro de memória')
                }
    
                containerAcoes.appendChild(bar);
            }, timeout);
            timeout = timeout + 300
            

            largura = largura + 40

            if (acao['label'] != ultimoProcesso) {
                largura = largura - larguraDaUltimaExecucao[acao['label']]

                if (larguraDaUltimaExecucao[acao['label']] > 0) {
                    larguraDaUltimaExecucao[acao['label']] = 0
                }
                bar.style.marginLeft = largura - 40 + 'px'
            }

            ultimoProcesso = acao['label']
            larguraDaUltimaExecucao[acao['label']] = larguraDaUltimaExecucao[acao['label']] + 40
        }
    }

    static gerarLabels(algoritmo) {
        document.getElementById('labels').innerHTML = ""
        // Criação da div principal
        document.getElementById('labels').innerHTML += `
            <div class="d-flex" id="flex-labels">
                <div class="alert alert-success" style="width: 330px; margin-right: 10px;">
                    <strong>Verde:</strong> Executando
                </div>
                <div class="alert alert-danger" style="width: 330px; margin-right: 10px;">
                    <strong>Vermelho:</strong> Sobrecarga
                </div>
            </div>`;

        // Adição da div adicional para EDF (se necessário)
        if (algoritmo == 'EDF') {
            document.getElementById('flex-labels').innerHTML += `
                <div class="alert alert-warning" style="width: 330px;">
                    <strong>X:</strong> Deadline já ultrapassada
                </div>`;
        }
    }
}