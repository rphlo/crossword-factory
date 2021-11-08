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
    const [def, setDef] = useState([[], []])
    const { username, api_token } = globalState.user
    const {uid: gridId} = useParams();
    const componentRef = React.useRef();
    const print = useReactToPrint({
      content: () => componentRef.current,
    });

    const loadGrid = async (id) => {
        try {
            const r = await fetch(process.env.REACT_APP_API_URL+'/grid/'+id)
            const d = await r.json()
            setTitle(d.title)
            let savedGrid = '';
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
            setDef(d.definitions)
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

    const selectBlock = (i, j) => {
        if (i===null) {
            setSelectedBlock(null)
            return
        }
        if (solutions[i][j] !== ' ') {
          setSelectedBlock([i, j])
        }
    }

    const setSolutionXY = (i, j, e) => {
        e.preventDefault()
        const char = e.key.toLowerCase()
        if (char.length === 1 && /[a-z-]/.test(char)){
            const newSol = solutions;
            newSol[i][j] = char.toUpperCase()
            setSolutions(newSol)
            setSelectedBlock(null);
            document.activeElement.blur();
            window.localStorage.setItem(gridId, JSON.stringify(newSol));
        }
        if(char === 'backspace'){
            const newSol = solutions;
            newSol[i][j] = ''
            setSolutions(newSol)
            setSelectedBlock(null);
            document.activeElement.blur();
            window.localStorage.setItem(gridId, JSON.stringify(newSol));
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

    return (
        <div className="container main-container">
            { !!solutions.length && (<div ref={componentRef} style={{margin:'15px'}}><h1>{title} <button onClick={share} class="btn btn-info">Partager</button></h1><table>
                <tr><td> </td>{solutions[0].map((val, j)=>(<td style={{textAlign: 'center'}}>{romanize(j+1)}.</td>))}</tr>
                { solutions.map((line, i)=>(
                    <tr><td>{i+1}.</td>{line.map((val, j)=>(<td style={{width: '2em', height: '2em', border: '1px solid #000'}}><input type='text' onFocus={() => selectBlock(i, j)} onBlur={() => selectBlock(null)} style={{outline: 'none', textAlign: 'center', border: '0', caretColor: 'transparent', width: '2em', backgroundColor: ((selectedBlock && (selectedBlock[0] === i && selectedBlock[1] === j)) ? 'red' : (val === ' ' ? 'black' : 'white'))}} onKeyDown={(e) => setSolutionXY(i, j, e)} value={solutions[i][j] ? val : ''}/></td>))}</tr>
                ))
                }
                </table>
                <p>Cliquer sur une case et taper la lettre désiré, Retour arrière pour re-initialiser la case.</p>
                <div style={{fontSize: '.7em'}}>
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
            <button class="btn btn-primary" onClick={print}>Imprimer</button>
            {shareModalOpen && <ShareModal url={document.location.href} onClose={()=>setShareModalOpen(false)}/> }
        </div>
    )
}

export default GridEditor