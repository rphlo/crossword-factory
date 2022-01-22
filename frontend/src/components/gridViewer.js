import React, { useEffect, useState } from 'react'

import useGlobalState from '../utils/useGlobalState'
import { useParams } from "react-router-dom";
import { useReactToPrint } from 'react-to-print';
import ShareModal from './shareModal';
const pkg = require('../../package.json')

function GridEditor() {
    const globalState = useGlobalState()
    const [solutions, setSolutions] = useState([])
    const [title, setTitle] = useState('')
    const [selectedBlock, setSelectedBlock] = useState(null)
    const [writingDirection, setWritingDirection] = useState('h')
    const [minHighlight, setMinHighlight] = useState(null)
    const [maxHighlight, setMaxHighlight] = useState(null)
    const [def, setDef] = useState([[], []])
    const [author, setAuthor] = useState(null);
    const { username, api_token } = globalState.user
    const {uid: gridId} = useParams();
    const componentRef = React.useRef();
    const aaa = React.useRef([]);
 
    const print = useReactToPrint({
      content: () => componentRef.current,
    });

    const loadGrid = async (id) => {
        try {
            const r = await fetch(process.env.REACT_APP_API_URL+'/grid/'+id)
            const d = await r.json()
            setTitle(d.title)
            setAuthor(d.author)
            let savedGrid = ''
            try {
                savedGrid = JSON.parse(window.localStorage.getItem(gridId)).map(l=>l.map(c=> (c==='' ? '_' : (c === ' ' ? '#' : c.toLowerCase()))).join('')).join('');
            } catch(e) {}
            const a = []
            for (let j=0; j< d.height; j++){
                a.push([])
                for (let i=0; i< d.width; i++){
                    const ch = d.grid[j*d.width+i]
                    if (savedGrid.length) {
                        const cha = ch === ' ' ? ch : savedGrid[j*d.width+i];
                        a[j].push(cha === '_' ? '' : cha.toUpperCase())
                    } else {
                        a[j].push(ch === '_' ? '': ch.toUpperCase())
                    }
                }
            }
            setSolutions(a)
            const defH = d.definitions[0].map(t=>t.replace('\n', ' ').replace('\r', ''))
            const defV = d.definitions[1].map(t=>t.replace('\n', ' ').replace('\r', ''))
            setDef([defH, defV])
        } catch(e) {
            window.location = '/'
        }
    }

    useEffect(()=>{
        if (gridId) {
            (async () => (await loadGrid(gridId)))()
        }
    }, [gridId])


    const romanize = (num) => {
        if (isNaN(num))
            return NaN;
        var digits = String(+num).split(""),
            key = ["","C","CC","CCC","CD","D","DC","DCC","DCCC","CM",
                   "","X","XX","XXX","XL","L","LX","LXX","LXXX","XC",
                   "","I","II","III","IV","V","VI","VII","VIII","IX"],
            roman = "",
            i = 3;
        while (i--)
            roman = (key[+digits.pop() + (i * 10)] || "") + roman;
        return Array(+digits.join("") + 1).join("M") + roman;
    }

    const selectNextBlock = (i, j) => {
        var wd = writingDirection
        var maxH = maxHighlight
        if (wd === 'h') {
            if (j + 1 < maxH) {
                selectBlock(i, j + 1)
            } else {
                selectBlock(null)
            }
        }
        if (wd === 'v') {
            if (i + 1 < maxH) {
                selectBlock(i + 1, j)
            } else {
                selectBlock(null)
            }
        }
    }

    React.useEffect(()=>{
        if(selectedBlock)
            aaa.current[selectedBlock[0]+'_'+selectedBlock[1]].focus()
    }, [selectedBlock, aaa.current])

    const switchWritingDir = (i, j, sb) => {
        let wd = writingDirection
        if(selectedBlock && (selectedBlock[0] === i && selectedBlock[1] === j)) {
            if (wd === 'h') {
                wd = 'v'
            } else {
                wd = 'h'
            }
        } else  {
            wd = 'h'  
        }
        if (wd === 'h') {
            var minH = j
            while (minH >= 0 && solutions[i][minH] !== ' ') {
                minH -= 1
            }
            setMinHighlight(minH)
            var maxH = j
            while (maxH < solutions[0].length && solutions[i][maxH] !== ' ') {
                maxH += 1
            }
            setMaxHighlight(maxH)
        }
        if (wd === 'v') {
            var minH = i
            while (minH >= 0 && solutions[minH][j] !== ' ') {
                minH -= 1
            }
            setMinHighlight(minH)
            var maxH = i
            while (maxH < solutions.length && solutions[maxH][j] !== ' ') {
                maxH += 1
            }
            setMaxHighlight(maxH)
        }
        setWritingDirection(wd)
        
    }
    const selectBlock = (i, j) => {
        if (i === null) {
            setSelectedBlock(null)
            document.activeElement.blur()
            return
        }
        if (solutions[i][j] !== ' ') {
            document.activeElement.setSelectionRange(0, document.activeElement.value.length)
            let wd = writingDirection
            setSelectedBlock([i, j])
            if (wd === 'h') {
                var minH = j
                while (minH >= 0 && solutions[i][minH] !== ' ') {
                    minH -= 1
                }
                setMinHighlight(minH)
                var maxH = j
                while (maxH < solutions[0].length && solutions[i][maxH] !== ' ') {
                    maxH += 1
                }
                setMaxHighlight(maxH)
            }
            if (wd === 'v') {
                var minH = i
                while (minH >= 0 && solutions[minH][j] !== ' ') {
                    minH -= 1
                }
                setMinHighlight(minH)
                var maxH = i
                while (maxH < solutions.length && solutions[maxH][j] !== ' ') {
                    maxH += 1
                }
                setMaxHighlight(maxH)
            }
        }
    }

    const setSolutionXY = (i, j, e) => {
        e.persist();
        e.preventDefault()
        const char = e.key.toLowerCase()
        if (char.length === 1 && /[a-z-]/.test(char)){
            const newSol = solutions;
            newSol[i][j] = char.toUpperCase()
            e.target.value = char.toUpperCase()
            setSolutions(newSol)
            selectNextBlock(i, j)
            window.localStorage.setItem(gridId, JSON.stringify(newSol));
        }
        if(char === 'backspace' || e.keyCode === 8){
            const newSol = solutions;
            newSol[i][j] = ''
            e.target.value = ''
            setSolutions(newSol)
            selectBlock(i, j)
            window.localStorage.setItem(gridId, JSON.stringify(newSol));
        }
    }

    const onSquareChanged = (i, j, e)=>{
        const c = e.target.value ? e.target.value.toUpperCase()[e.target.value.length-1] : '';
        
        if(solutions[i][j] !== ' ' && c.length === 1 && /[A-Z-]/.test(c)){
            const newSol = solutions
            newSol[i][j] = c
            e.target.value = c
            setSolutions(newSol)
            selectNextBlock(i, j)
            window.localStorage.setItem(gridId, JSON.stringify(newSol));
        } else {
            e.target.value = ''
        }
    }

    let webShareApiAvailable = false
    if (navigator.canShare) {
      webShareApiAvailable = true
    }

    const [shareModalOpen, setShareModalOpen] = useState(false)
    const share = () => {
      if(webShareApiAvailable) {
        try {
          navigator.share({url: document.location.href}).then(()=>{}).catch(()=>{});
        } catch (e) {}
      } else {
        setShareModalOpen(true)
      }
    }

    const isGridFull = () => {
        return solutions.map(l=>l.map(c=> c).join('')).join('').length === solutions.length*solutions[0].length
    }
    const checkSolution = async () => {
        const { createHash } = await import('crypto');
        const txt = solutions.map(l=>l.map(c=>c.toLowerCase()).join('')).join('')
        const h = createHash('sha256')
        h.update(txt, 'ascii')
        const solutionHash = h.digest('base64').replaceAll('=', '').replaceAll('+', '-').replaceAll('/', '_')
        
        try {
            const resp = await fetch(
                process.env.REACT_APP_API_URL + '/grid/' + gridId + '/check',
                {
                    method: 'POST',
                    credentials: 'omit',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({hash: solutionHash})
                }
            )
            if(resp.status === 200){
                const data = await resp.json()
                if (data.is_ok) {
                    alert('Bravo, votre solution est correcte!')
                } else {
                    alert('Desolé, votre solution est érronée!')
                }
            }
        } catch(e) {
            alert('Une erreur est survenue...')
        }
    }

    return (
        <div className="container main-container">
            { !!solutions.length && (<div ref={componentRef} style={{margin:'15px'}}><h1>{title} <button onClick={share} class="btn btn-info inv">Partager</button></h1><table className="t">
                <tr><td> </td>{solutions[0].map((val, j)=>(<td style={{textAlign: 'center'}}>{romanize(j+1)}.</td>))}</tr>
                { solutions.map((line, i)=>(
                    <tr><td>{i+1}.</td>{line.map((val, j)=>(<td className={'box ' + (val === ' ' ? 'blackBox': '')}>
                        {val !== ' ' && (
                        <input type='text' key={i+'_'+j} id={'square_'+i+'_'+j} onMouseDown={()=>{switchWritingDir(i, j, selectedBlock)}} onFocus={() => selectBlock(i, j)} className='iBox' ref={(input) => { aaa.current[i+'_'+j] = input }}  style={{outline: 'none', textAlign: 'center', border: '0', caretColor: 'transparent', backgroundColor: ((selectedBlock && (selectedBlock[0] === i && selectedBlock[1] === j)) ? 'red' : ((selectedBlock && ((writingDirection === 'h' && i === selectedBlock[0] && j > minHighlight && j < maxHighlight)||(writingDirection === 'v' && j === selectedBlock[1] && i > minHighlight && i < maxHighlight)))?'#f99':(val === ' ' ? 'black' : 'white')))}} onKeyDown={(e) => setSolutionXY(i, j, e)} defaultValue={solutions[i][j] ? val : ''} onChange={(e) => onSquareChanged(i, j, e)}/>
                        )}
                    </td>))}</tr>
                ))
                }
                </table>
                <p className='inv'>Cliquer sur une case et taper la lettre désiré, Retour arrière pour re-initialiser la case.</p>
                {isGridFull() && <p><button className="btn btn-secondary inv" onClick={checkSolution}>Verifier votre solution</button></p>}
                <div className='d'>
                <h3>Définitions</h3>
                <div class="row">
                    <div class="col-6" style={{borderRight: '1px solid #000'}}>
                        <h4>Horizontalement</h4>
                        <div>
                        {def[0].map((l, i) => (
                            <div style={{margin: '5px'}}><span style={{width: '3em', display: 'inline-block'}}>{i+1}. </span><span>{l}</span></div>
                        ))}
                        </div>
                    </div>

                    <div class="col-6">
                        <h4>Verticalement</h4>
                        <div>
                        {def[1].map((l, i) => (
                            <div style={{margin: '5px'}}><span style={{width: '3em', display: 'inline-block'}}>{romanize(i+1)}. </span><span>{l}</span></div>
                        ))}
                        </div>
                    </div>
                </div>
                </div>
            </div>)
            }
            <button className="btn btn-primary" onClick={print}>Imprimer</button>
            {shareModalOpen && <ShareModal url={document.location.href} onClose={()=>setShareModalOpen(false)}/> }
        </div>
    )
}

export default GridEditor