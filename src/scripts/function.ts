import { decode, encode } from "utf8"

const qSel = <T extends Element>(selector: string): T | null =>
    document.querySelector(selector)
const qSelAll = <T extends Element>(selector: string): NodeListOf<T> | null =>
    document.querySelectorAll(selector)
const wait = (ms: number) =>
    new Promise<void>((res, _1) => { setInterval(res, ms) })

/**
 * Escape string to prevent XSS
 * @param str string to escape
 * @returns escaped string
 */
function escapeHTML(str: string){
    var p = document.createElement("p");
    p.appendChild(document.createTextNode(str))
    return p.innerHTML;
}

/**
 * Template string
 * @param base original string
 * @param data data to use to replace the string
 * @param unsafe **dangerous** - disable escaping HTML code
 * (this could open door to XSS attack)
 * @param unsafeProperties **dangerous** - whitelist certain key in the `data` to be unescaped
 * (only work if `unsafe` is set to true)
 * (again, this could open door to XSS attack)
 * @returns a new string with all data replaced
 */
function templateStr(base: string, data: { [x in string]: string }, unsafe = false, unsafeProperties: string[] = []) {
    var result = base
    for (let i in data) result = result
        .replace(`$<${i}>`,
            unsafe && unsafeProperties.includes(i)
                ? data[i]
                : escapeHTML(data[i]))

    return result
}

/**
 * Check if **any** of the value provided is true
 * @param data data to check
 * @returns true if **any** of the value provided is true
 */
function any(...data: any[]) {
    const ndata: boolean[] = data.map(v => {
        if (v === null || v === undefined || v === false) return false
        return true
    })
    return ndata.reduce((a, b) => a || b)
}

/**
 * Check if **all** of the value provided is true
 * @param data data to check
 * @returns true if **all** of the value provided is tru
 */
function all(...data: any[]) {
    const ndata: boolean[] = data.map(v => {
        if (v === null || v === undefined || v === false) return false
        return true
    })
    return ndata.reduce((a, b) => a && b)
}

/**
 * Delete all child in a parent node
 * @param parent parent node to delete all child
 * @param excludedNode a string array to exclude all the matched nodes
 * in querySelect or a node object array to exclude the nodes
 */
function clearChild(parent: Node, excludedNode: (Node | string)[] = []) {
    while (parent.childNodes.length > 0 + excludedNode.length) {
        var eN: Node[] = []
        if (typeof excludedNode[0] == "string") {
            for (let i of excludedNode) {
                const elm = qSel(i.toString())
                if (elm == null) continue
                eN.push(elm)
            }
        } else {
            eN = excludedNode as Node[]
        }
        if (parent.lastChild == null || eN.includes(parent.lastChild)) continue
        parent.removeChild(parent.lastChild)
    }
}

const string2Hex = (rawstr: string) => encode(rawstr)
    .split("")
    .map(c => c.charCodeAt(0).toString(16).padStart(2, "0"))
    .join("");

const hex2String = (hexstr: string) => decode(hexstr
    .split(/(\w\w)/g)
    .filter(p => !!p)
    .map(c => String.fromCharCode(parseInt(c, 16)))
    .join(""))

export {
    qSel,
    qSelAll,
    wait,
    templateStr,
    any,
    all,
    clearChild,
    escapeHTML,
    string2Hex,
    hex2String
}