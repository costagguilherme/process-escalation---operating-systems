class Escalonador {

    constructor(processosData) {
        this.processosData = processosData
        this.processos = processosData.processos

        this.num_processos = this.processos.length
        this.num_processos_executados = 0

        this.quantum = processosData.quantum
        this.sobrecarga = processosData.sobrecarga


        this.tempoAtual = 0

        // Variáveis especificas do SJF
        this.timerSJF = 0

        // Variáveis especificas do RR
        this.tempoAtualRoundRobinFoiInicializado = false
        this.timerRR = 0


        // Variáveis especificas do EDF
        this.timerEDF = 0
        this.tempoAtualEDFFoiInicializado = 0

        this.cpu = []
        this.fila = []
    }

    /*************************************************************************************
     * 
     *                                       GERAL
     * 
     ************************************************************************************/

    /**
     * Inicializa o tempo atual como sendo o tempo de chegada do primeiro processo
     */
    inicializarTempoAtual(processo) {
        if (this.num_processos_executados == 0) {
            this.tempoAtual = processo.tempo_de_chegada
        }
    }

    /*************************************************************************************
     * 
     *                                       FIFO
     * 
     ************************************************************************************/

    async fifo(result) {
        let processos = this.processos;
        let timer = 0;

        while (this.num_processos_executados < this.num_processos) {
            for (const processo of processos) {
                if (processo.tempo_de_chegada == timer) {
                    this.executaFIFO(processo);
                }
            }
            timer++;
        }

        let tempoTotal = 0;
        for (const processo of this.processos) {
            tempoTotal += processo.tempo_total;
        }
        this.processosData['tempo_medio'] = tempoTotal / this.num_processos;
        this.num_processos_executados = 0;

        return this.processosData;
    }

    /**
     * Execução do processo na CPU utilizando o FIFO
     */
    executaFIFO(processo) {
        this.inicializarTempoAtual(processo)

        let tempo_execucao = processo.tempo_de_execucao - 1
        let iteracao_final = tempo_execucao + this.tempoAtual

        while (this.tempoAtual <= iteracao_final) {
            this.processosData.grafico.push({ 'tempo': this.tempoAtual, 'label': processo.label, 'status': 'executando' })
            processo.tempo_total = this.tempoAtual - processo.tempo_de_chegada + 1
            this.tempoAtual++
        }

        const label = processo.label
        for (let i = 0; i < this.processos.length; i++) {
            if (this.processos[i].label == label) {
                this.processos[i] = processo
            }
        }

        this.num_processos_executados++
            this.processosData.processos = this.processos
    }

    /*************************************************************************************
     * 
     *                                       SJF
     * 
     ************************************************************************************/

    sjf() {
        let processos = this.processos

        while (this.num_processos_executados < this.num_processos) {
            for (const processo of processos) {
                console.log(processo.label + " " + processo.tempo_de_chegada + " " + this.timerSJF)
                if (processo.tempo_de_chegada == this.timerSJF) {
                    this.fila.push(processo)
                }
            }

            if (this.fila.length > 0) {
                this.print(this.fila)
                let menor_processo = this.pegarProcessoMaisCurto(this.fila)
                this.executaSJF(menor_processo)
            }


            this.timerSJF++
        }

        let tempoTotal = 0
        for (const processo of this.processos) {
            tempoTotal += processo.tempo_total
        }
        this.processosData['tempo_medio'] = tempoTotal / this.num_processos
        return this.processosData;
    }

    /**
     * Retorna o processo mais curto da fila de prontos
     */
    pegarProcessoMaisCurto(fila_de_processos) {
        let menor_tempo = Infinity;
        let menor_processo = null;

        for (const processo of fila_de_processos) {
            if (processo.tempo_de_execucao < menor_tempo) {
                menor_tempo = processo.tempo_de_execucao;
                menor_processo = processo;
            }
        }
        return menor_processo
    }

    verificarSeAlgumProcessoPrecisaEntrarNaFila(tempoAtual, labelDoProcessoEmExecucao) {
        for (const processo of this.processos) {
            if (processo.tempo_de_chegada == tempoAtual && labelDoProcessoEmExecucao != processo.label) {
                this.fila.push(processo)
                this.timerSJF = tempoAtual
            }
        }
    }

    /**
     * Execução do processo na CPU utilizando SJF
     */
    executaSJF(processo) {
        this.inicializarTempoAtual(processo)

        let tempo_execucao = processo.tempo_de_execucao - 1
        let iteracao_final = tempo_execucao + this.tempoAtual

        while (this.tempoAtual <= iteracao_final) {
            this.processosData.grafico.push({ 'tempo': this.tempoAtual, 'label': processo.label, 'status': 'executando' })
            processo.tempo_total = this.tempoAtual - processo.tempo_de_chegada + 1
            this.verificarSeAlgumProcessoPrecisaEntrarNaFila(this.tempoAtual, processo.label)
            this.tempoAtual++
        }

        const label = processo.label
        for (let i = 0; i < this.processos.length; i++) {
            if (this.processos[i].label == label) {
                this.processos[i] = processo
            }
        }

        this.num_processos_executados++
            this.processosData.processos = this.processos

        // Retira processo da fila de prontos, pois acabou de ser executado
        this.fila = this.fila.filter(p => p.label !== label);
    }

    /*************************************************************************************
     * 
     *                                     ROUND ROBIN
     * 
     ************************************************************************************/

    roundrobin() {
        for (let i = 0; i < this.processos.length; i++) {
            this.processos[i].tempo_restante = this.processos[i].tempo_de_execucao
            this.processos[i].falta_executar = undefined
        }

        let processos = this.processos
        while (this.num_processos_executados < this.num_processos) {
            for (const processo of processos) {
                if (
                    (processo.tempo_de_chegada == this.timerRR && processo.tempo_restante > 0) ||
                    processo.falta_executar == true
                ) {
                    this.fila.push(processo)
                        // console.log('t: ' + this.tempoAtual + ' processo: ' + processo.label)
                    this.executaRoundRobin(processo)
                }
            }
            this.timerRR++
        }

        let tempoTotal = 0
        for (const processo of this.processos) {
            tempoTotal += processo.tempo_total
        }
        this.processosData['tempo_medio'] = tempoTotal / this.num_processos
        this.num_processos_executados = 0
            // this.print(this.processosData)
        return this.processosData;
    }

    executaRoundRobin(processo) {
        this.inicializarTempoAtualRoundRobin(processo)

        let iteracao_final_da_execucao = this.quantum + this.tempoAtual - 1

        while (this.tempoAtual <= iteracao_final_da_execucao && processo.tempo_restante > 0) {
            this.processosData.grafico.push({ 'tempo': this.tempoAtual, 'label': processo.label, 'status': 'executando' })
            processo.tempo_total = this.tempoAtual - processo.tempo_de_chegada + 1
            processo.tempo_restante = processo.tempo_restante - 1
            this.verificarSeAlgumProcessoPrecisaEntrarNaFilaAlgoritmoNaoPreemptivo(this.tempoAtual, processo.label)
            this.tempoAtual++
                this.timerRR++
        }

        if (processo.tempo_restante <= 0) {
            this.num_processos_executados++
                processo.falta_executar = false
        } else {
            processo.falta_executar = true

            let iteracao_final_da_sobrecarga = this.sobrecarga + this.tempoAtual - 1

            while (this.tempoAtual <= iteracao_final_da_sobrecarga) {
                this.processosData.grafico.push({ 'tempo': this.tempoAtual, 'label': processo.label, 'status': 'sobrecarga' })
                processo.tempo_total = this.tempoAtual - processo.tempo_de_chegada + 1
                this.verificarSeAlgumProcessoPrecisaEntrarNaFilaAlgoritmoNaoPreemptivo(this.tempoAtual, processo.label)
                this.tempoAtual++
                    this.timerRR++
            }
        }


        const label = processo.label
        for (let i = 0; i < this.processos.length; i++) {
            if (this.processos[i].label == label) {
                this.processos[i] = processo
            }
        }

        this.fila = this.fila.filter(p => p.label !== label);
        this.processosData.processos = this.processos
    }

    inicializarTempoAtualRoundRobin(processo) {
        if (this.tempoAtualRoundRobinFoiInicializado == false) {
            this.tempoAtual = processo.tempo_de_chegada
        }
        this.tempoAtualRoundRobinFoiInicializado = true
    }

    verificarSeAlgumProcessoPrecisaEntrarNaFilaAlgoritmoNaoPreemptivo(tempoAtual, labelDoProcessoEmExecucao) {
        for (let i = 0; i < this.processos.length; i++) {
            if (this.processos[i].tempo_de_chegada == tempoAtual && labelDoProcessoEmExecucao != this.processos[i].label) {

                let processoEstaNaFila = false
                for (const processoNaFila of this.fila) {
                    if (processoNaFila.label == this.processos[i].label) {
                        processoEstaNaFila = true
                        break
                    }
                }

                if (processoEstaNaFila == false) {
                    this.fila.push(this.processos[i])
                    this.processos[i].falta_executar = true
                }

            }
        }
        this.timerEDF = tempoAtual
        this.timerRR = tempoAtual

    }

    /*************************************************************************************
     * 
     *                                     EDF
     * 
     ************************************************************************************/
    calculaTempoDeEstouroDaDeadline() {
        for (let i = 0; i < this.processos.length; i++) {
            let tempoChegada = this.processos[i].tempo_de_chegada
            let deadline = this.processos[i].deadline
            this.processos[i]['tempo_estouro_deadline'] = tempoChegada + deadline
        }
    }

    edf() {
        this.calculaTempoDeEstouroDaDeadline()
        for (let i = 0; i < this.processos.length; i++) {
            this.processos[i].tempo_restante = this.processos[i].tempo_de_execucao
            this.processos[i].falta_executar = undefined
        }

        let processos = this.processos

        while (this.num_processos_executados < this.num_processos) {
            for (const processo of processos) {
                if (processo.tempo_de_chegada <= this.timerEDF && processo.tempo_restante > 0) {
                    this.fila.push(processo);
                }
            }

            if (this.fila.length > 0) {
                let proximo_processo = this.pegarProcessoMaisCedo(this.fila);
                this.executaEDF(proximo_processo);
            }

            this.timerEDF++;
        }


        let tempoTotal = 0;
        for (const processo of this.processos) {
            tempoTotal += processo.tempo_total;
        }
        this.processosData['tempo_medio'] = tempoTotal / this.num_processos;
        // this.print(this.processosData)
        return this.processosData;
    }

    executaEDF(processo) {
        this.inicializarTempoAtualEDF(processo);

        let iteracao_final_da_execucao = this.quantum + this.tempoAtual - 1

        while (this.tempoAtual <= iteracao_final_da_execucao && processo.tempo_restante > 0) {
            this.processosData.grafico.push({
                'tempo': this.tempoAtual,
                'label': processo.label,
                'status': 'executando',
                'tempo_estouro_deadline': processo['tempo_estouro_deadline']
            })
            processo.tempo_total = this.tempoAtual - processo.tempo_de_chegada + 1
            processo.tempo_restante = processo.tempo_restante - 1
            this.verificarSeAlgumProcessoPrecisaEntrarNaFilaAlgoritmoNaoPreemptivo(this.tempoAtual, processo.label)

            this.tempoAtual++
                this.timerEDF++
        }

        if (processo.tempo_restante <= 0) {
            this.num_processos_executados++
                processo.falta_executar = false
        } else {
            processo.falta_executar = true

            let iteracao_final_da_sobrecarga = this.sobrecarga + this.tempoAtual - 1

            while (this.tempoAtual <= iteracao_final_da_sobrecarga) {
                this.processosData.grafico.push({
                    'tempo': this.tempoAtual,
                    'label': processo.label,
                    'status': 'sobrecarga',
                    'tempo_estouro_deadline': processo['tempo_estouro_deadline']
                })
                processo.tempo_total = this.tempoAtual - processo.tempo_de_chegada + 1
                this.verificarSeAlgumProcessoPrecisaEntrarNaFilaAlgoritmoNaoPreemptivo(this.tempoAtual, processo.label)
                this.tempoAtual++
                    this.timerEDF++
            }
        }


        const label = processo.label
        for (let i = 0; i < this.processos.length; i++) {
            if (this.processos[i].label == label) {
                this.processos[i] = processo
            }
        }

        this.fila = this.fila.filter(p => p.label !== label);
        this.processosData.processos = this.processos
    }

    pegarProcessoMaisCedo(fila_de_processos) {
        let menor_deadline = Infinity;
        let processo_escolhido = null;

        for (const processo of fila_de_processos) {
            if (processo.deadline < menor_deadline) {
                menor_deadline = processo.deadline;
                processo_escolhido = processo;
            }
        }

        return processo_escolhido;
    }

    inicializarTempoAtualEDF(processo) {
        if (this.tempoAtualEDFFoiInicializado == false) {
            this.tempoAtual = processo.tempo_de_chegada
        }
        this.tempoAtualEDFFoiInicializado = true
    }


    print(data) {
        console.log(JSON.stringify(data))
    }
}