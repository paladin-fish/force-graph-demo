import React from 'react';
import './App.css';
import ForceGraph from 'force-graph';
import * as d3 from 'd3-force'


import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import CssBaseline from '@material-ui/core/CssBaseline';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import CloseIcon from '@material-ui/icons/Close';
import Typography from '@material-ui/core/Typography';
import Tooltip from '@material-ui/core/Tooltip';
import Drawer from '@material-ui/core/Drawer';
import TextField from '@material-ui/core/TextField';
import Autocomplete from '@material-ui/lab/Autocomplete';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import Button from '@material-ui/core/Button';
const LOGO_ICON = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAFKADAAQAAAABAAAAFAAAAACy3fD9AAABG0lEQVQ4Ee2UMU7DMBSG04DElLFIHIChaiSO0ali4BwcARZUpp6gh2BAAlU9QZcuPQVtOrQbCNHy/a6NEikWT4nExC99tuO89yd24pckR13RzWAHezgY+SJuC6+Qg5PMNmA1icWt8cg7NFMYwBLuoAAlWaT8LjxCH17AvbIMhrpoqBvy5LFJaTJvomU3lVYlZTIUknWZx+hqG3LTYFa93eLq37DF5vnUP9nDSx42gXs48w82d6c1kU/MhYOuwz+qiYlO1S35ohRdHpem40MZhr9cB126hRUsYAwWhVyVvp/icG3JjMSE4lBoD+eg8qW9OoFQGxn+Kr3ZOTz4SHm5D6DiqKW34Y38Hjjpq6o4qgx9wKeRd5/zTO/MvgGHOWNG89+XIAAAAABJRU5ErkJggg=="

const commonImg = new Image();
commonImg.src = LOGO_ICON;
export default class Custom3DGraph extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            data: [],
            dagMode: 'null',
            isResize: false,
            nodeSize: 3 
        }
        this.ele = null        // 容器对象
        this.graph = null       // 画布对象

        this.selectedNodes = new Set()   // 当前选中的结点
        this.highlightNodes = new Set();  // 需要高亮的结点
        this.highlightLinks = new Set();  // 需要高亮的线
        this.hoverHighlightNodes = new Set(); // hover状态下，需要高亮的结点
        this.hoverHighlightLinks = new Set(); // hover状态下，需要高亮的线

        this.toAdjustTimer = null;      // 结点自适应屏幕的执行定时器
        this.clickEventTime = null      // 存放点击结点需要执行方法的定时器
        this.resizeTime = null;
    }
    initData = data => {
        data.nodes.map((node) => {  // 如果存在图片，先进行处理
            if (node.img) {
                const img = new Image();
                img.src = node.img;
                node.img = img
            }
        })

        // 处理结点的neighbors数据
        // data.links.forEach(link => {
        //     const a = data.nodes.find(bean => bean.id === link.source);
        //     const b = data.nodes.find(bean => bean.id === link.target);
        //     // console.log(data.nodes, a,b)
        //     !a.neighbors && (a.neighbors = []);
        //     !b.neighbors && (b.neighbors = []);
        //     a.neighbors.push(b);
        //     b.neighbors.push(a);

        //     !a.links && (a.links = []);
        //     !b.links && (b.links = []);
        //     if (b.parent && (b.parent === a.id)) {
        //         link.dashed = false
        //     } else {
        //         link.dashed = true
        //     }
        //     a.links.push(link);
        //     b.links.push(link);
        // });
        this.setState({ data: data })
    }

    handleFont = (node, context) => {
        const arr = node.font.split('-')
        const type = arr[0]
        let color = arr[arr.length - 1]
        let content = arr[arr.length - 2]
        if (!color.startsWith('#')) {
          content = color
          color = '#000000'
        }
        

        // console.log('content', content, divNode.innerHTML)
        // if (!content) {
        //   _shortCutIcon = LOGO_ICON
        //   return
        // }
        let font = 'Font-Awesome-Brands'
        let fontWeight = '400'
        if (type === 'fab') {
          font = 'Font-Awesome-Brands'
          fontWeight = '400'
        } else if (type === 'fas') {
          font = 'Font-Awesome-Solid'
          fontWeight = '900'
        } else {
          font = 'Font-Awesome-Regular'
          fontWeight = '400'
        }
        // 通过div来hack获取图标
        let divNode = document.getElementById('shortCut')
        if (!divNode) {
            divNode = document.createElement('div')
            divNode.id = 'shortCut'
            document.body.appendChild(divNode);
        }
        divNode.innerHTML = content
        divNode.style.fontFamily = font;
        divNode.style.fontWeight = fontWeight
        divNode.style.display = 'none';

        context.fillStyle = color
        let fontSize = this.state.dagMode === 'null'? '10px': '28px'
        context.font = `${fontWeight} ${fontSize} ${font}`
        context.fillText(divNode.innerHTML, node.x, node.y)
        // document.fonts.ready.then(() => {
        // context.fillText(divNode.innerHTML, node.x, node.y)
        // document.body.removeChild(divNode)
        // _shortCutIcon = _canvas.toDataURL('image/png') || LOGO_ICON
        // this.changeShortCutIcon(_shortCutIcon)
        // })
    }
    initGraph = () => {
        this.graph = new ForceGraph()
        const dashLen = 8, gapLen= 6
        this.graph(this.ele)
            .graphData(this.state.data)
            // .width(400).height(400).backgroundColor('#ccc')   // 设置canvas样式的3个方法
            .nodeAutoColorBy('group')   // 根据自定义的type来将同一类node节点颜色统一
            .nodeVal(this.state.nodeSize)  // node 圈圈的大小
            .nodeLabel('label')  // hover上去显示的内容
            .linkWidth(link => this.selectedNodes.size > 0? this.highlightLinks.has(link.id) || this.hoverHighlightLinks.has(link.id) ? 2 : 0 : 1)
            .linkColor(link => this.highlightLinks.size > 0 ? this.highlightLinks.has(link.id) ? 'rgba(242, 223, 223)' : 'transparent' : this.hoverHighlightLinks.has(link.id) ? '#CF5659' : 'rgba(242, 223, 223)')
            .linkLineDash(link => {
                if (this.highlightLinks.has(link.id)) {
                    console.log('link===', link)
                    return link.dashed && [dashLen, gapLen]
                } 
            })
            .linkDirectionalParticleSpeed(0.001)
            .linkDirectionalParticleWidth(link => (this.highlightLinks.has(link.id)? /* || this.hoverHighlightLinks.has(link)*/ link.dashed ? 0 : 2:0))
            .linkDirectionalParticles(10)
            .linkDirectionalParticleColor('rgb(168, 86, 207)')
            .nodeCanvasObject((node, ctx, globalScale) => {  // 文字节点
                const label = node.label;
                const fontSize = 12 / globalScale;
                const imgSize = 1.2 * fontSize
                const existImg = !!node.img

                // 绘制外圈
                ctx.beginPath();
                //this.state.dagMode === 'null'?
                let basicNum = this.state.nodeSize
                let textPosition = 2* basicNum
                if (this.selectedNodes.has(node)) {
                    // 选中结点 半径11 填充颜色 ##FBEFEF 100% 100% 线宽4 #CF5659
                    // basicNum = 6
                    textPosition = 2.25*basicNum
                    ctx.arc(node.x, node.y, 1.25*basicNum, 0 * Math.PI, 2 * Math.PI)
                    ctx.lineWidth = basicNum;
                    ctx.strokeStyle = '#CF5659'
                    ctx.stroke()
                    ctx.fillStyle = 'rgba(249,240,239)';
                    ctx.fill()
                } else if (this.highlightNodes.has(node) || this.hoverHighlightNodes.has(node)) {
                    // 选中结点 半径8 填充颜色 #CF5659 100% 线宽4 #ffffff 70%
                    // basicNum = 5
                    ctx.arc(node.x, node.y, basicNum, 0 * Math.PI, 2 * Math.PI)
                    ctx.lineWidth = basicNum;
                    ctx.strokeStyle = 'rgba(233, 202, 202, 1)';
                    ctx.stroke()
                    ctx.fillStyle = '#CF5659'
                    ctx.fill()
                } else {
                    // 默认 半径8 填充颜色 #4E4747 100% 线宽2 #E6DFDF 88%
                    textPosition = this.selectedNodes.size>0?  1.5* basicNum: 2* basicNum
                    ctx.arc(node.x, node.y, basicNum, 0 * Math.PI, 2 * Math.PI)
                    ctx.lineWidth = this.selectedNodes.size>0? basicNum/2 : basicNum;
                    ctx.strokeStyle = this.selectedNodes.size>0? '#EBE8E8' : 'rgba(233, 202, 202, 1)';
                    // ctx.strokeStyle = this.selectedNodes.size>0? '#EBE8E8' : 'rgba(230, 223, 233, .88)';
                    ctx.stroke()
                    // ctx.arc(node.x, node.y, 8, 0 * Math.PI, 2 * Math.PI)
                    ctx.fillStyle = this.selectedNodes.size>0? '#EBE8E8' : '#CF5659'
                    // ctx.fillStyle = this.selectedNodes.size>0? '#EBE8E8' : '#4E4747'
                    ctx.fill()
                }
                ctx.closePath();

                /*if (existImg) {  // 有图片显示图片
                    // 添加图片
                    ctx.beginPath();
                    let inlineR = this.state.dagMode === 'null'? 5: 14
                    ctx.save(); // 保存当前ctx的状态
                    ctx.arc(node.x, node.y, inlineR, 0 * Math.PI, 2 * Math.PI)
                    try {
                        ctx.drawImage(node.img, node.x - inlineR, node.y - inlineR, 2 * inlineR, 2 * inlineR);      
                    } catch (e) {
                        ctx.drawImage(commonImg, node.x - inlineR, node.y - inlineR, 2 * inlineR, 2 * inlineR);      
                    }
                    ctx.closePath();
                    ctx.restore(); // 还原状态
                } else if (node.font) {
                    // console.log(node.font)
                    this.handleFont(node, ctx)
                } else if (node.emoji) {
                    ctx.fillStyle = '#1E1F2A'
                    ctx.font = this.state.dagMode === 'null'?  `10px AppleColorEmoji`:`28px AppleColorEmoji`
                    ctx.fillText(node.emoji, this.state.dagMode === 'null'? node.x +1: node.x, this.state.dagMode === 'null'? node.y +1: node.y + 3)
                } else {    // 没图片显示默认
                    // ctx.fill()
                }*/
                // 添加文字
                ctx.font = `${fontSize}px PingFangSC-Medium,Sans-Serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#312727';
                if (this.selectedNodes.has(node)) {
                    ctx.fillStyle = '#CF5659';
                } else {
                    if (this.highlightNodes.size > 0 && !this.highlightNodes.has(node)) {
                        ctx.fillStyle = '#C3BBBC';
                    }
                }
                ctx.fillText(label, node.x, node.y + textPosition + fontSize/ 2);
            })
            .onNodeHover(node => {
                this.ele.style.cursor = node ? '-webkit-grab' : null;
            })
            .onLinkHover(link => {
                if (this.selectedNodes.size > 0) {
                    return
                }
                this.hoverHighlightNodes.clear();
                this.hoverHighlightLinks.clear();

                if (link) {
                    this.hoverHighlightLinks.add(link);
                    this.hoverHighlightNodes.add(link.source);
                    this.hoverHighlightNodes.add(link.target);
                }
            })
            .onNodeClick((node, event) => {
                if (this.clickEventTime) {
                    console.log("dblclick");
                    clearTimeout(this.clickEventTime)
                    this.clickEventTime = null;
                    window.open('https://baidu.com')
                } else {
                    console.log("first click")
                    this.clickEventTime = setTimeout(() => {
                        clearTimeout(this.clickEventTime)
                        this.clickEventTime = null;
                        if (event.ctrlKey || event.shiftKey || event.altKey) { // multi-selection
                            if (this.selectedNodes.has(node)) {
                                this.selectedNodes.delete(node)
                                this.highlightNodes.delete(node);
                                node.neighbors.forEach(neighbor => this.highlightNodes.delete(neighbor));
                                node.links.forEach(link => this.highlightLinks.delete(link));
                            } else {
                                this.selectedNodes.add(node)
                                this.highlightNodes.add(node);
                                node.neighbors.forEach(neighbor => this.highlightNodes.add(neighbor));
                                node.links.forEach(link => this.highlightLinks.add(link));
                            }
                        } else { // single-selection
                            if (this.selectedNodes.has(node)) {
                                this.highlightNodes.clear();
                                this.highlightLinks.clear();
                                this.selectedNodes.clear();
                            } else {
                                this.highlightNodes.clear();
                                this.highlightLinks.clear();
                                this.selectedNodes.clear();
                                this.selectedNodes.add(node)
                                if (node) {
                                    this.highlightNodes.add(node);
                                    node.neighbors.forEach(neighbor => this.highlightNodes.add(neighbor));
                                    node.links.forEach(link => this.highlightLinks.add(link));
                                }
                            }
                        }
                    }, 200)
                }

                //   this.graph.nodeColor(this.graph.nodeColor()); // update color of selected nodes
            })
            .onBackgroundClick((event) => {
                console.log('# BackgroundClick==', event)
                this.highlightNodes.clear();
                this.highlightLinks.clear();
                this.selectedNodes.clear();
            })
            .onNodeDragEnd(node => {
                node.fx = node.x;
                node.fy = node.y;
            })
            .d3VelocityDecay(.2)
            .d3AlphaDecay(0.02)
            .dagLevelDistance(100)
            // .d3Force('charge').strength(node => 0.01)
            .dagMode(this.state.dagMode)
            .d3Force('link').distance(link => 100);
            // .d3Force('collide', d3.forceCollide(100).strength(0.5))

             // Dash animation
            const st = +new Date();
            const dashAnimateTime = 700; // time to animate a single dash
            let self = this;
            (function animate() {
                // if (self.selectedNodes.size> 0){
                    const t = ((+new Date() - st) % dashAnimateTime) / dashAnimateTime;
                    const lineDash = t < 0.5 ? [0, gapLen * t * 2, dashLen, gapLen * (1 - t * 2)] : [dashLen * (t - 0.5) * 2, gapLen, dashLen * (1 - (t - 0.5) * 2), 0];
                    self.graph.linkLineDash(link => {
                        if (self.highlightLinks.has(link.id)) {
                            return link.dashed && lineDash
                        } else {
                            return null
                        }
                    });
                // }
            requestAnimationFrame(animate);
            })(); // IIFE
    }
    componentDidMount() {
        // 异步获取数据
        fetch('./basic.json').then(res => res.json()).then(data => {
            // 对数据做一些额外处理
            this.initData(data)
            // 渲染graph
            this.initGraph()
            setTimeout(() => {
                this.graph.zoomToFit(400)
                // clearTimeout(this.toAdjustTimer)
                // this.toAdjustTimer = null
            }, 2000)
        })
        window.addEventListener('resize', () => {
            console.log('resize', this.ele.getClientRects())
            if (this.resizeTime) {
                clearTimeout(this.resizeTime)
                this.resizeTime = null
            }
            this.resizeTime = setTimeout(() => {
                const { width, height} = document.getElementById('root').getClientRects()
                this.graph.width(width).height(height)
            }, 100)
        })
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.state.drawerOpen === prevState.drawerOpen) {
            if (this.graph) {
                this.updateGraph()
            }
        }
    }
    updateGraph = () => {
        if (this.state.dagMode !== 'null') {
            this.graph
                .dagMode(this.state.dagMode)
                .nodeVal(this.state.nodeSize)
                // .d3Force('collide', d3.forceCollide(100))
                .d3Force('collide', d3.forceCollide(50).strength(0.5))
        } else {
            this.graph
                .dagMode(this.state.dagMode)
                .nodeVal(this.state.nodeSize)
                .d3Force('link').distance(link => 100)
            //     .refresh();
            // this.graph.refresh()
        }
    }

    toFitNode = (_node) => {
        if (_node) {
            // 点击将该node移到视图中
            this.graph.centerAt(_node.x, _node.y, 1000);
            this.graph.zoom(8, 2000);
        }
    }
    renderDrawer = () => {
        return <Drawer anchor={"left"} variant="temporary" /*"persistent"*/ style={{width: '375px'}} open={this.state.drawerOpen} onClose={()=>this.setState({drawerOpen: false})}>
                <div style={{width: '375px'}}>
                    <CssBaseline />
                    <AppBar
                        position="relative"
                    >
                        <Toolbar>
                        <Typography variant="h6" noWrap style={{flex:1}}>
                            操作面板
                        </Typography>
                        <Tooltip title="关闭操作面板" aria-label="关闭操作面板">
                            <IconButton
                                color="inherit"
                                aria-label="关闭操作面板"
                                edge="end"
                                onClick={()=>this.setState({drawerOpen: false})}
                            >
                                <CloseIcon />
                            </IconButton>
                        </Tooltip>
                        </Toolbar>
                    </AppBar>
                    <div style={{padding: '0 16px', boxSizing: 'border-box',width: '100%', textAlign: 'start'}}>
                        <div style={{margin: '16px 0', textAlign: 'start'}}>
                            <span>结点分布类型：</span>
                            <Select
                                labelId="demo-simple-select-label"
                                id="demo-simple-select"
                                label="选择结点"
                                style={{ }}
                                fullWidth={true}
                                value={this.state.dagMode}
                                onChange={(e, val) => {
                                    // this.graph && this.graph.dagMode(val) && (this.defaultControls = val)
                                    // console.log(e, val)
                                    this.setState({ dagMode: e.target.value , nodeSize: e.target.value === 'null'? 3 : 8})
                                    setTimeout(() => {
                                        this.graph.zoomToFit(400)
                                    }, 2000)
                                }}
                            >
                                <MenuItem value={'null'}>默认</MenuItem>
                                <MenuItem value={'lr'}>左往右</MenuItem>
                                <MenuItem value={'td'}>上往下</MenuItem>
                                <MenuItem value={'radialin'}>结点朝内</MenuItem>
                                <MenuItem value={'radialout'}>结点朝外</MenuItem>
                            </Select>
                        </div>
                        <div style={{margin: '16px 0', textAlign: 'start'}}>
                            <span>搜索结点：</span>
                            <Autocomplete
                                    id="combo-box-demo"
                                    onChange={(e, node) => { this.toFitNode(node) }}
                                    options={this.state.data && this.state.data.nodes || []}
                                    getOptionLabel={(option) => option.label}
                                    style={{ }}
                                    clearOnBlur={true}
                                    renderInput={(params) => <TextField {...params} label="" placeholder="搜索结点" />}
                                />
                        </div>
                        
                       
                        <div style={{margin: '16px 0', textAlign: 'start'}}>
                            <span>结点大小：</span>
                            <TextField 
                                id="outlined-basic" 
                                label="" 
                                placeholder="结点大小"
                                fullWidth={true}
                                onChange={(e) => { 
                                    console.log(e.target.value)
                                    if (0<= e.target.value && e.target.value < 50) {
                                        this.setState({nodeSize: e.target.value})
                                    }
                                    if (!e.target.value) {
                                        this.setState({nodeSize: 0})
                                    }
                                }} 
                                value={this.state.nodeSize} 
                                type='number'  />
                        </div>
                        <Button /*variant="outlined"*/ fullWidth={true}  style={{height: 56}} onClick={() => {
                            if (this.toAdjustTimer) {
                                clearTimeout(this.toAdjustTimer)
                            }
                            this.toAdjustTimer = setTimeout(() => {
                                this.graph.zoomToFit(400)
                                clearTimeout(this.toAdjustTimer)
                                this.toAdjustTimer = null
                            }, 400)
                        }}>适应屏幕</Button>
                    </div>
                    
                        
                </div>
            </Drawer>
    }

    render() {
        console.log('data=-=', this.state.data)
        return (
            <div>
                <div style={{
                    zIndex: 1199, position: 'fixed', top: 0, left: 0, backgroundColor: "transparent", textAlign: 'center', display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '16px'
                }}>
                    <Tooltip title="打开操作面板" aria-label="打开操作面板">
                        <IconButton
                            color="inherit"
                            aria-label="打开操作面板"
                            edge="end"
                            onClick={()=>this.setState({drawerOpen: true})}
                        >
                            <MenuIcon />
                        </IconButton>
                    </Tooltip>
                </div>
                {this.renderDrawer()}
                <div ref={(ref) => this.ele = ref} >

                </div>
            </div>
        )
    }
}