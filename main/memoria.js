class Memoria {

    constructor(processos) {
        this.tamanhoRAM = 200
        this.tamanhoPaginaReal = 4
        this.numeroPaginasReais = this.tamanhoRAM / this.tamanhoPaginaReal

        this.ram = []
        this.disco = []

        this.maximodePaginasPorProcesso = 10
        this.maximoDeProcessosNaRam = this.numeroPaginasReais / this.maximodePaginasPorProcesso

        this.processos = processos

        this.numeroPaginasVirtuais = 120

        this.fifoTimerRAM = 0

    }

    criarMemoriaRam() {
        document.getElementById('titulo-ram').innerHTML = 'RAM';

        const ram = document.getElementById('ram');
        ram.innerHTML = "";

        let counter = 0
        for (let i = 0; i < 5; i++) {
            const fila = document.createElement('div');
            fila.classList.add('fila');

            for (let j = 0; j < 10; j++) {
                const pagina = document.createElement('div');
                pagina.classList.add('pagina');
                fila.appendChild(pagina);
                pagina.innerHTML = counter
                pagina.id = 'ram' + counter
                this.ram.push({ 'pagina': counter, 'processo': undefined, 'entrada': 0, 'contador': 0 })
                counter++
            }

            ram.appendChild(fila);
        }
    }

    criarDisco() {
        const disco = document.getElementById('disco');
        disco.innerHTML = "";
        let counter = 0
        for (let i = 0; i < 10; i++) {
            const fila = document.createElement('div');
            fila.classList.add('fila');

            for (let j = 0; j < 12; j++) {
                const pagina = document.createElement('div');
                pagina.classList.add('pagina');
                fila.appendChild(pagina);
                pagina.innerHTML = counter
                pagina.id = 'disco' + counter
                this.disco.push({ 'pagina': counter, 'processo': undefined, 'entrada': 0 })
                counter++
            }

            disco.appendChild(fila);
        }
    }

    async adicionarPaginasNoDisco(processos) {
        let counter = 0
        for (let processo of processos) {
            let numeroPaginas = processo['paginas']
            for (let i = 0; i < numeroPaginas; i++) {
                this.disco[counter].processo = processo['label']
                counter = counter + 1
            }
        }

        this.atualizarGraficoDisco()
    }


    /*********************************************************************************************
     * 
     *                               LRU - Menos recentemente usada
     * 
     *********************************************************************************************/

    lru(labelProcesso) {
        let numeroPaginasParaAlocar = this.pegarNumeroDePaginasDoProcesso(labelProcesso)
        let numeroPaginasQueProcessoPossuiNaRam = this.pegarNumeroDePaginasDoProcessoNaRam(labelProcesso)
        numeroPaginasParaAlocar = numeroPaginasParaAlocar - numeroPaginasQueProcessoPossuiNaRam

        this.removerDoDisco(labelProcesso)

        let removidasDaRam = []
        let menosUsadas = this.pegarPaginasMenosRecentementeUtilizadas(numeroPaginasParaAlocar)
        for (const menosUsada of menosUsadas) {
            for (const pagina of this.ram) {
                if (pagina['pagina'] == menosUsada) {

                    if (pagina['processo'] != undefined) {
                        removidasDaRam.push(pagina['processo'])
                    }

                    this.ram[menosUsada].processo = labelProcesso
                    this.ram[menosUsada].contador = this.ram[menosUsada].contador + 1
                }
            }
        }

        this.moverParaOdisco(removidasDaRam)
        this.atualizarGraficoRam()
    }

    pegarPaginasMenosRecentementeUtilizadas(N) {
        const dadosOrdenados = [...this.ram];
        // Ordenar os dados com base no contador em ordem crescente
        dadosOrdenados.sort((a, b) => a.contador - b.contador);

        // Extrair as N páginas com os menores valores de contador após a ordenação
        return dadosOrdenados.slice(0, N).map(item => item.pagina);
    }

    /*********************************************************************************************
     * 
     *                                          FIFO
     * 
     *********************************************************************************************/

    fifo(labelProcesso) {
        let numeroPaginasParaAlocar = this.pegarNumeroDePaginasDoProcesso(labelProcesso)
        let numeroPaginasQueProcessoPossuiNaRam = this.pegarNumeroDePaginasDoProcessoNaRam(labelProcesso)
        numeroPaginasParaAlocar = numeroPaginasParaAlocar - numeroPaginasQueProcessoPossuiNaRam

        this.removerDoDisco(labelProcesso)

        let removidasDaRam = []
        for (let i = 0; i < this.numeroPaginasReais; i++) {
            let numeroPaginasLivre = this.numeroDePaginasLivreNaRam()
            if (numeroPaginasLivre == 0) {
                let posicao = this.encontrarPrimeiraOcorrenciaDoProcessoQueEntrouPrimeiro(labelProcesso)
                i = posicao
            }


            if (this.ram[i].processo == undefined || numeroPaginasLivre == 0) {
                if (this.ram[i].processo != undefined) {
                    removidasDaRam.push(this.ram[i].processo)
                }
                this.ram[i].processo = labelProcesso
                this.ram[i].entrada = this.fifoTimerRAM
                numeroPaginasParaAlocar--
            }

            this.fifoTimerRAM++

            if (numeroPaginasParaAlocar == 0) {
                break
            }

            if (i == 49 && numeroPaginasParaAlocar > 0) {
                let posicao = this.encontrarPrimeiraOcorrenciaDoProcessoQueEntrouPrimeiro(labelProcesso)
                i = posicao
            }
        }
        this.moverParaOdisco(removidasDaRam)
        this.atualizarGraficoRam()
    }

    encontrarProcessoQueEntrouPrimeiro(labelProcesso) {
        let menorTempo = Infinity;
        let processoMenorTempo = null;

        for (const dado of this.ram) {
            if ((dado.entrada < menorTempo) && dado.processo != labelProcesso) {
                menorTempo = dado.entrada;
                processoMenorTempo = dado.processo;
            }
        }

        return processoMenorTempo;
    }

    encontrarPrimeiraOcorrenciaDoProcessoQueEntrouPrimeiro(labelProcesso) {
        let labelPrimeiro = this.encontrarProcessoQueEntrouPrimeiro(labelProcesso)
        for (let pagina of this.ram) {
            if (labelPrimeiro == pagina['processo']) {
                return pagina['pagina']
            }
        }
    }

    /*********************************************************************************************
     * 
     *                               Manipulações de RAM e Disco
     * 
     *********************************************************************************************/
        colocarPaginasDoProcessoNaRam(algoritmoTroca, labelProcesso) {
            if (algoritmoTroca == 'FIFO') {
                this.fifo(labelProcesso)
            }
    
            if (algoritmoTroca == 'LRU') {
                this.lru(labelProcesso)
            }
    
        }
    
        verificaSeProcessoEstaCompletamenteNaRam(label) {
            let numeroDePaginasDoProcesso = this.pegarNumeroDePaginasDoProcesso(label)
            let numeroDePaginasDoProcessoNaRam = this.pegarNumeroDePaginasDoProcessoNaRam(label)
            if (numeroDePaginasDoProcesso == numeroDePaginasDoProcessoNaRam) {
                return true
            }
            return false
        }
    
    
        removerDoDisco(labelProcesso) {
            for (let i = 0; i < this.disco.length; i++) {
                if (this.disco[i]['processo'] == labelProcesso) {
                    this.disco[i]['processo'] = undefined
                }
            }
            this.atualizarGraficoDisco()
        }
    
        moverParaOdisco(processos) {
            for (const processoLabel of processos) {
                for (const [i, pagina] of this.disco.entries()) {
                    if (pagina['processo'] == undefined) {
                        this.disco[i]['processo'] = processoLabel
                        break
                    }
                }
            }
            this.atualizarGraficoDisco()
        }

    pegarNumeroDePaginasDoProcessoNaRam(processoLabel) {
        let counter = 0
        for (let pagina of this.ram) {
            if (processoLabel == pagina['processo']) {
                counter = counter + 1
            }
        }
        return counter
    }

    pegarNumeroDePaginasDoProcesso(labelProcesso) {
        for (let processo of this.processos) {
            if (labelProcesso == processo['label']) {
                return processo['paginas']
            }
        }
    }

    numeroDePaginasLivreNaRam() {
        let paginasLivre = 0
        for (const [i, pagina] of this.ram.entries()) {
            if (pagina['processo'] == undefined) {
                paginasLivre++
            }
        }

        return paginasLivre;
    }

    /*********************************************************************************************
     * 
     *                               Manipulação da Interface
     * 
     *********************************************************************************************/
    atualizarGraficoRam() {
        for (let i = 0; i < this.numeroPaginasReais; i++) {
            (document.getElementById('ram' + i)).innerHTML = i
        }

        for (let pagina of this.ram) {
            if (pagina['processo'])
            document.getElementById('ram' + pagina['pagina']).innerHTML = `${pagina['pagina']} <span style="color: red;">${pagina['processo']}</span>`
        }
    }

    atualizarGraficoDisco() {
        for (let i = 0; i < this.numeroPaginasVirtuais; i++) {
            (document.getElementById('disco' + i)).innerHTML = i
        }

        for (let pagina of this.disco) {
            if (pagina['processo'])
                document.getElementById('disco' + pagina['pagina']).innerHTML = `${pagina['pagina']} <span style="color: red;">${pagina['processo']}</span>`
        }
    }
}