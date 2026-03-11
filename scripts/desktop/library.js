/**
 * added gitintegration
 */

const SiConf = {
    commentFieldName: 'commentField',
    commentPageId: 'page_comments',
    commentColumnId: 'column_comments',
    commentSearchboxId: 'comments_searchbox',
    commentPlaceholderId: 'COMMENTS'
}

let isAdmin = false;
let isApproval = true;
let isSearch = false;
let canFullReject = false;
let submitFunction = function(){};
let unrequireAllFlag = false;
let unrequireCache = [];
let submitStepButton;


function init() {
    
    // testsystem message
    
    const testHint = document.createElement('span');
    testHint.classList.add('testsystem');
    testHint.textContent = 'TEST';
    document.getElementById('jr-step-actionbar-button-group-more-functions').prepend(testHint);
    document.getElementById('jr-headline').classList.add('testheadline');
    
    //
    
    adminMode();
    
    // submitStepButton = document.querySelector('button[data-action="sendStep"]');
    
    // parseApprovalLimits();
    
    // if (isApproval) setupApprovalRadioButtons();

    // if (jr_get_subtable_row_ids('invoiceAttachments').length > 0) $j('#jr-tab-page_attachments').parent().toggleClass('si-highlight', true);

    // parseStepConfig();
    
    // if (canSetRecurring) setupRecurringInvoiceState();

    // loadComments();
    if (typeof setLocalStates === 'function') setLocalStates();
    if (typeof bindLocalEvents === 'function') bindLocalEvents();

}


function removeClosableFromNotifications() {
    document.getElementById('jr-notification-close-all').style.display = 'none';
    document.querySelectorAll('.jr-notification-close').forEach(i => { i.style.display = 'none' });    
}


function enableAllFields() {
    document.querySelectorAll('#pageContainer input, #pageContainer select, #pageContainer textArea').forEach( i => {
        if (i.id && !i.classList.contains('blank')) jr_set_disabled(i.id, false);
    });
}


function parseStepConfig() {
    
    const step = jr_get_value('step');
          conf = $SSCONFIG[step];
    
    // hideSections
    console.log(conf);
    jr_hide(conf.hidesections);
    
    // "disable" section
    
    conf.disablesections.forEach(s => {
        document.querySelector(`#${s} .jr-section`).classList.add('ss-readonly');
        
        document.querySelectorAll(`#${s} input, #${s} select, #${s} textarea`).forEach(i => {
            let n = i.id;
            if (n.startsWith('display_')) n = n.substring(8);
            
            let element = document.getElementById(n);
            if (element && !element.classList.contains('blank')) {
                jr_set_disabled(n);
            }
            
        });
        
        // table control patch
        if (s === 'section_posting') {
            document.querySelectorAll(`#${s} .jr-dialog-form-table-add-rows-count`).forEach(a => {
                a.style.display = 'none';
            });
            document.querySelectorAll(`#${s} .jr-dialog-form-table-buttons button`).forEach(a => {
                //if (!a.id.startsWith('copy')) {
                    a.style.display = 'none';
                //} else {
                  //  a.style.marginLeft = '0px';
                //}
            });
        }
        
    });
    
    
    // enforce field states
    // - hide 
    jr_hide(conf.enforce.hidden);
    
    // - required
    conf.enforce.required.forEach(i => {
        jr_set_required(i);
    });
    // readonly
    conf.enforce.readonly.forEach(i => {
        jr_set_readonly(i);
    });
    
    // disabled
    conf.enforce.disabled.forEach(i => {
        jr_set_disabled(i);
    });
    
    // disabled
    conf.enforce.enabled.forEach(i => {
        jr_set_disabled(i, false);
    });
    
    conf.onload();

    submitFunction = conf.onsubmit;
    
}

function adminMode() {
    const adminList = [ 'talal.gorani@simplify-services.de' ]
    if (adminList.includes($JRUSER.userName)) {
        jr_show('systemFields');
        isAdmin = true;
    }
}


function inlineRadioButtons(tFieldName ,inSet) {
    document.getElementById(tFieldName).after(getRadioContainer(inSet));
    document.querySelectorAll(`#div_${tFieldName} .ss-radio-column`).forEach( (f, i) => {
        const p = document.getElementById(inSet[i]).parentNode;
        while(p.children.length) {
            f.appendChild(p.children[0]);
        }
    });
}


function getRadioContainer(inSet) {
    
    const oc = document.createElement('div'),
          fields = inSet.length;
    oc.classList.add('ss-radio-container');
    
    for (let i = 0; i < fields; i++) {
        const c = document.createElement('div');
        c.classList.add('ss-radio-column');
        const l = document.createElement('label');
        l.textContent = jr_get_label(inSet[i]);
        c.appendChild(l);
        oc.appendChild(c);
    }
    return oc;
}

function radioToggleClickHandler(e) {
    const rName = e.target.id.match(/^desc_(.*)_label$/i)[1],
          val = jr_get_value(rName);

    jr_set_value(rName, (val === '' || val === '0')?'1':'0');
}



/**
 * ### COMMENTS ### (start)
 */

function loadComments() {
    
    // jquery contains hook
    
    jQuery.expr[':'].containsCaseInsensitive = function(n, _, r) {
        return jQuery(n).text().toLowerCase().indexOf(r[3].toLowerCase()) >= 0;
    };

    const processId = jr_get_value('processid');
    const workflowId = jr_get_value('workflowid');
    
    $j.get('/index.php', {
        cmd: 'Step_Comments',
        processid: processId,
        workflowid: workflowId
    }).done(resp => { renderComments(resp); });
    
}


function renderComments(comments) {
    const jComments = $j(comments);
    jComments.find('.jr-comment-input-wrapper').remove();
    jComments.find('#genericFormLayerFormControls').remove();
    
    
    const comments_count = jComments.find('article').length;
    
    if (comments_count > 0) {
        
        const tabField = $j(`#jr-tab-${SiConf.commentPageId}`);
        tabField.text(`${tabField.text()} (${comments_count})`); 
        
        $j(`#jr-tab-${SiConf.commentPageId}`).parent().toggleClass('si-highlight', true);
        $j(`#${SiConf.commentSearchboxId}`)
            .attr('placeholder', jr_get_message('simply_comment_search_placeholder'))
            .on('input', e => {
                if (window.SiSearchDelayActive) clearTimeout(window.SiSearchDelayActive);
                
                window.SiSearchDelayActive = setTimeout(executeSearch, 400, e.target.value);
            });
    } else {
        jr_hide(SiConf.commentSearchboxId);
    }
    
    const parentWidth = $j('#' + SiConf.commentColumnId + 'Container').css('width');
    if (parentWidth !== '')
        jComments.css('width', parentWidth);
        
    $j('#div_' + SiConf.commentPlaceholderId + ' .jr-dialog-form-element')
        .empty()
        .append(jComments);
}


function executeSearch(param) {
    window.SiSearchDelayActive = null;

    if (param.trim().length > 0) {
        const results = $j(`#div_${SiConf.commentPlaceholderId} article:containsCaseInsensitive("${param}")`);
        if (results.length > 0){
            $j(`#div_${SiConf.commentPlaceholderId} article`).hide();
            results.show();
            return;
        } else {
            const sbe = $j(`#div_${SiConf.commentSearchboxId} .jr-dialog-form-element`);
            sbe.toggleClass('si-error-shake', true);
            setTimeout(() => { sbe.toggleClass('si-error-shake', false); }, 400);
        }
        
    }
    $j(`#div_${SiConf.commentPlaceholderId} article`).show();
}


function saveComment() {

    const commentFieldName = SiConf.commentFieldName;
    
    if ($j('#' + commentFieldName).hasClass('si-comment--saved'))
        return;
    
    const comment = jr_get_value(commentFieldName);

    if (comment.trim().length === 0) {
        return;
    }

    $j('#' + commentFieldName).toggleClass('si-comment--saved', true);

    $j.ajax({
        url: 'index.php?cmd=Step_Comments',
        method: 'POST',
        data: {
            processid: jr_get_value('processid'),
            workflowid: jr_get_value('workflowid'),
            action: 'save',
            text: comment
        },
        async: false
    }).done(() => { return true; });
}

function setCommentChanged() {
    $j('#' + SiConf.commentFieldName).toggleClass('si-comment--saved', false);
}


/**
 * ### COMMENTS ### (end)
 */


/**
 * ### SSTOOLSET ### (start)
 */
 

function buildAjaxRequestBody() {
    return {
        'workflowid': jr_get_value('workflowid'),
        'jr_simulation': jr_get_value('jr_simulation'),
        'dialogValues': {
            'processid': jr_get_value('processid'),
            'workflowid': jr_get_value('workflowid'),
            'csrf_token': jr_get_value('csrf_token'),
            'dialog': jr_get_value('dialog'),
            'processname': jr_get_value('processname'),
            'tablename': jr_get_value('tablename'),
            'jr_simulation': jr_get_value('jr_simulation'),
            'jr_new_step': jr_get_value('jr_new_step'),
            'step': jr_get_value('step'),
            'jr_mode': jr_get_value('jr_mode'),
            'version': jr_get_value('version'),
            'backlink': jr_get_value('backlink')
        }
    }
}

function ssQuietAsync(functionId, params = {}, successFunc, errorFunc = e => { console.error(e); } ){
    
    const requestBody = buildAjaxRequestBody();
    requestBody.functionId = functionId;
    requestBody.userParameters = params;
    
    jQuery.ajax({
        method: 'POST',
        headers: {
            Accept: 'application/json, text/javascript, */*;'
        },
        dataType: 'json',
        url: './index.php?cmd=Ajax_ExecutePHPFunction',
        data: requestBody
    })
    .done(successFunc)
    .fail(errorFunc);

}


 
function ss_show(elementName, flag = true) {
    if (flag) {
        jr_show(elementName);
    } else {
        jr_hide(elementName);
    }
}


function cloneSubtableSecondaryValue(stName, row, sourceField, targetField, delimiter, index) {

    const source = jr_get_value(`display_${stName}_${sourceField}_${row}`);
    if (!source || !source.includes(delimiter)) {
        jr_set_subtable_value(stName, row, targetField, '');
        return;
    }
    
    const value = source.split(delimiter)[index];
    jr_set_subtable_value(stName, row, targetField, value);
}


async function storeToClipBoard(text) {
    const type = "text/plain",
          blob = new Blob([text], { type }),
          data = [new ClipboardItem({ [type]: blob })];
          
    await navigator.clipboard.write(data);
}

function unrequireAll(status, skipList = ['commentField', 'rejection_reason', 'supplier_email']) {
    
    if (status) {
        document.querySelectorAll('.required').forEach(i => {
            let k = i.id;
            if (k.startsWith('display_')) k = k.substring(8);
            if (skipList.includes(k)) return;
            jr_set_required(k, false);
            unrequireCache.push(k);
        });
    } else {
        unrequireCache.forEach( q => { jr_set_required(q, true); });
        unrequireCache = [];
    }
    unrequireAllFlag = status;
}


function labelForButton(buttonName) {
    const container = document.querySelector(`#div_${buttonName} > td`);
    container.classList.add('jr-dialog-form-label-wrapper','text-right');
    
    const label = document.createElement('label');
    label.id = `${buttonName}_label`;
    label.classList.add('jr-dialog-form-label');
    
    const label2 = document.querySelector(`#div_${buttonName} span`);
    label.textContent = label2.textContent;
    
    container.textContent = '';
    container.appendChild(label);
    
    label2.style.display = 'none';
}

function getTableColumnsByStName(stName) {
    const tableFieldset = [];
    document.querySelectorAll(`#${stName} th`).forEach(i => {
        const fieldName = i.id.match(new RegExp(`^div_${stName}_(.*)_header$`))[1];
        if (fieldName === 'rowinfo') return;
        tableFieldset.push(fieldName);
    });
    return tableFieldset;
}

 
/**
 * ### SSTOOLSET ### (end)
 */