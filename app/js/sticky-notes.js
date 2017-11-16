/**
 *@fileoverview control event and data about sticky notes
 *@author AkihisaOchi
 *
 * ***************** localStorage memo *****************
 *
 * use localStorage for following two points
 * [1] store ids of element
 * [2] store information of style definition
 *
 * [ STORAGE ] = localStorage >> for simple access
 * [ STORAGE.IDS ] = { array } >> for [1]
 * [ STORAGE.***( uniqueId ) ] = { object } >> for [2]
 *
 * prop & value of [2]
 * {
 *  'clientLeft'  : 'distance from screen left',
 *  'clientTop'   : 'distance from screen top',
 *  'className'   : 'className define background-color',
 *  'clientWidth' : 'textarea width',
 *  'clientHeight': 'textarea height',
 *  'value'       : 'textarea value',
 * }
 *
 * ***************** localStorage memo *****************
 *
 */

(function() {

  /** STORAGEにはローカルストレージオブジェクトが格納される @const { object } */
  let STORAGE = localStorage;

  STORAGE.clear(); //デバッグ用ローカルストレージをクリアする

  /** ローカルストレージに記憶する要素 @let { array } */
  let BOX_IDS = [];

  /** appendTargetIdは要素をhtmlにappendするための鍵となるId @const { string } */
  const SCREEN_TARGET = document.getElementById( 'js__append--target' );



  window.addEventListener( 'load', function () {

    //STORAGEにIDSというプロパティがあるかどうかを調べ条件分岐させる
    if ( 'IDS' in STORAGE ) {

      //STORAGEにIDSというプロパティが存在すれば２回目以降のロード
      //ローカルストレージに保存された情報を画面に再現する
      elementCreateFromArray();

    } else {

      //STORAGEにIDSというプロパティが存在しなければ1回目のロード
      //STORAGE_IDSがundefinedの場合は付箋要素を1つ作成し画面に表示する
      firstElementCreate();

    }

  });



  /**
   *生成したユニークなidをもとに付箋要素を生成し、関連情報をローカルストレージに記憶する
   */
  function firstElementCreate() {

      //ユニークなidをを生成
      let uniqueId = createUniqueId();

      //idを元に生成した付箋要素を画面に表示
      appendElements( SCREEN_TARGET, [ createBox( uniqueId ) ] );

      //付箋要素の情報をローカルストレージに記憶
      saveBoxValueToLocalStorage( uniqueId );

  }//--- firstElementCreate()

  function elementCreateFromArray() {
    BOX_IDS = JSON.parse( STORAGE.IDS );

    for ( let key in BOX_IDS ) {

      //ID毎に付箋要素を生成し記憶されたスタイルを適用する処理
      let thisId = BOX_IDS[ key ];

      //idを元に生成した付箋要素を画面に表示
      appendElements( SCREEN_TARGET, [ createBox( uniqueId ) ] );

      //ローカルストレージの情報を要素に適用する
      applyBoxValueFromLocalStorage( uniqueId );

    }
  }//--- elementCreateFromArray()

  /**
   *@param { string } keyId - Boxの情報を記憶する鍵となるid
   *@return { object } 付箋紙を再現するhtml要素を返す
   */
  function createBox( keyId ) {

    //引数のデータ型が期待通りかどうかを判定
    if ( typeof keyId !== 'string' ) throw new Error( 'In createBox() at "keyId" must be string' );

    //boxWrapperElementはreturnされるhtml要素
    let boxWrapperElement = createElementAndSetAttribute( 'section', { 'class': 'box box__color--yellow' } );
    boxWrapperElement.setAttribute('id', keyId);

    //boxHeadlineElementはboxWrapperElementの子要素
    let boxHeadlineElement = createElementAndSetAttribute( 'h1', { 'class': 'box__headline' } ),
        appendButtonElement = createElementAndSetAttribute( 'i', { 'class': 'fa fa-plus', 'role': 'button' , 'aria-hidden': 'true' } ),
        settingButtonElement = createElementAndSetAttribute('i', { 'class': 'fa fa-cog', 'role': 'button', 'aria-hidden': 'true' }),
        removeButtonElement = createElementAndSetAttribute( 'i', { 'class': 'fa fa-trash-o', 'role': 'button' , 'aria-hidden': 'true' } );

    //appendButtonElementにイベントを追加
    appendButtonElement.addEventListener( 'click', elementAppendOnButtonClicked );

    //settingButtonElementにイベントを追加
    settingButtonElement.addEventListener( 'click', elementSettingOnButtonClicked );

    //removeButtonElementにイベントを追加
    removeButtonElement.addEventListener( 'click', elementRemoveOnButtonClicked );

    //boxHeadlineElementに子要素を追加
    boxHeadlineElement = appendElements( boxHeadlineElement, [ appendButtonElement, settingButtonElement, removeButtonElement ] );

    //boxHeadlineElementにイベントを追加
    boxHeadlineElement.addEventListener( 'mousedown', elementMoveOnDrug );

    //boxTextareaElementはboxWrapperElementの子要素
    let boxTextareaElement = createElementAndSetAttribute('textarea', { 'class': 'box__textarea' });
    boxTextareaElement.style.fontSize = '2rem';

    //boxTextareaにイベントを追加・削除(テキストエリアのリサイズ可能範囲でマウスポインタの形状を変更する)
    boxTextareaElement.addEventListener( 'mouseover', addEventCursorAllScrollOnMouseover );
    boxTextareaElement.addEventListener( 'mouseout', function() {
      boxTextareaElement.removeEventListener( 'mouseover', addEventCursorAllScrollOnMouseover );
    });

    boxWrapperElement = appendElements( boxWrapperElement, [ boxHeadlineElement, boxTextareaElement ] );
    boxWrapperElement.style.zIndex = 100;

    boxWrapperElement.addEventListener( 'mousedown', controlZIndexOnBoxMousedown );


    controlIdsToLocalStorage( keyId, 'push' );


    //boxWrapperElementを返す
    return boxWrapperElement;

  }//--- end createBox()

  /**
   *createUniqueIdは重複することのない文字列を返す()
   *@return { string } Boxの情報を記憶する鍵となるidを生成する
   */
  function createUniqueId() {

    //characterGroupは生成される文字列の素材
    //idLengthは生成する文字列の長さ
    //uniqueIdは最終的にリターンする
    let characterGroup = 'abcdefghijklmnopqrstuvwxyz0123456789',
        idLength = 25,
        uniqueId = '';

    //idLengthの数だけループしてランダムに選択した値をuniqueIdに格納していく
    for( let i = 0; i < idLength; i++ ){

      uniqueId += characterGroup[ Math.floor( Math.random() * idLength ) ];

    }

    //uniqueIdをリターンして処理終了
    return uniqueId;

  }//--- end createUniqueId()

  /**
   *elementMoveOnDrugはマウスの移動に合わせて要素を移動させる
   *マウスの移動が要素の移動よりも速い場合に備えてdocumentに対してmouseomoveイベントを設定する
   *@param { object } mouseDownObject - mousedown時の情報が入ったオブジェクト
   */
  function elementMoveOnDrug( mouseDownObject ) {

    //mousedownイベントの対象となる要素と移動処理を適用する親要素を取得
    let [ targetElement, parentElement ] = [ mouseDownObject.target, mouseDownObject.target.parentNode ];

    //スクリーンをはみ出すかどうかを判定するために画面サイズを取得
    let [ windowWidth, windowHeight ] = [ screen.width, screen.height ];

    //mousemove時にスクリーンを超えたかどうかを判定するために親要素のサイズを取得
    let [ parentWidth, parentHeight ] = [ parentElement.offsetWidth, parentElement.offsetHeight ];

    //マウスポインタの移動時に付箋要素のテキストエリアが選択されるとバグになるので、選択を禁止する
    document.onselectstart = function(){ return false; };
    document.getElementsByTagName( 'textarea' ).Enable = false;

    //マウスの移動が要素の移動よりも速い場合に備えてdocumentにmousemoveイベントを設置
    document.addEventListener( 'mousemove', elementMoveWithMouseMove );

    /**
     *mouseの移動に合わせて要素を移動させる
     *@param { object } mouseMoveObject - mousemove時の情報が入ったオブジェクト
     */
    function elementMoveWithMouseMove( mouseMoveObject ) {

      //mousemoveに合わせて位置を変更するために要素の位置情報を取得
      let [ parentPositionLeft, parentPositionTop ] = [ parentElement.offsetLeft, parentElement.offsetTop ];
      let [ parentPositionRight, parentPositionBottom ] = [ ( parentPositionLeft + parentWidth ), ( parentPositionTop + parentHeight ) ];

      //X軸座標において要素がスクリーンを越えて移動しないためのガード節
      if ( parentPositionRight > windowWidth ) {

        //付箋要素の右端が画面の右端を越えたとき右には移動させない
        parentPositionLeft = windowWidth - parentWidth;

      } else if ( parentPositionLeft < 0 ) {

        //付箋要素の左端が画面の左端を越えたとき左には移動させない
        parentPositionLeft = 0;

      } else {

        //画面内であればマウスポインタの移動値を適用する
        parentPositionRight += mouseMoveObject.movementX;
        parentPositionLeft += mouseMoveObject.movementX;

      }

      //Y軸座標において要素がスクリーンを超えて移動しないためのガード節
      if ( parentPositionBottom > windowHeight ) {

        //付箋要素の下端が画面の下端を越えたとき下には移動させない
        parentPositionTop = windowHeight - parentHeight;

      } else if ( parentPositionTop < 0 ) {

        //付箋要素の上端が画面の上橋を越えたとき上には移動させない
        parentPositionTop = 0;

      } else {

        //画面内であればマウスポインタの移動値を適用する
        parentPositionBottom += mouseMoveObject.movementY;
        parentPositionTop += mouseMoveObject.movementY;

      }

      //付箋要素にマウスポインタの移動値を適用
      parentElement.style.left = parentPositionLeft + 'px';
      parentElement.style.top = parentPositionTop + 'px';

    }//--- end elementMoveWithMouseMove()

    //mouseup時にmousemoveのイベントを削除する
    document.addEventListener( 'mouseup', function () {

      //mousemonveイベントを削除
      document.removeEventListener( 'mousemove', elementMoveWithMouseMove );

      //移動イベントが終わった際には、選択の禁止を解除する
      document.onselectstart = function () { return true; };
      document.getElementsByTagName( 'textarea' ).Enable = true;

    });

  }//--- end elementMoveOnDrug()

  /**
   *テキストエリアのリサイズ可能範囲(右下部分)にマウスポインタを合わせた場合にcursorプロパティにall-scrollを適用する
   *@param { object } mouseoverObject - mouseover時の情報が入ったオブジェクト
   */
  function addEventCursorAllScrollOnMouseover( mouseoverObject ) {

    mouseoverObject.target.addEventListener( 'mousemove', function ( mousemoveObject ) {

      //条件判定のために情報を取得
      let targetElement = mousemoveObject.target,
          [ targetWidth, targetHeight ] = [ targetElement.clientWidth, targetElement.clientHeight ],
          [ cursorPositionX, cursorPositionY ] = [ mousemoveObject.offsetX, mousemoveObject.offsetY ];

      //テキストエリアのリサイズ可能範囲(右下から15*15以内の範囲)かどうかを判定し、cursorプロパティにall-scrollを適用する
      targetElement.style.cursor =
        (cursorPositionX > (targetWidth - 15) && cursorPositionY > (targetHeight - 15)) ? 'all-scroll': 'auto';

    });

  }//--- end addEventCursorAllScrollOnMouseover()

  /**
   *appendボタンがクリックされたときに要素を追加する
   *@param {object} clickObject - クリック時の情報が入ったオブジェクト
   */
  function elementAppendOnButtonClicked( clickObject ) {

    let grandParentElement = clickObject.target.parentElement.parentElement,
        [ addPositionX, addPositionY ] = [ grandParentElement.offsetLeft, ( grandParentElement.offsetTop + grandParentElement.offsetHeight ) ];

    let uniqueId = createUniqueId();
    let appendBox = createBox(uniqueId);

    appendBox.style.left = addPositionX + 'px';
    appendBox.style.top = addPositionY + 'px';

    appendElements( SCREEN_TARGET, [ appendBox ] );

  }//--- end elementAppendOnButtonClicked()

  /**
   *settingボタンが押されたときにメニューバーを表示する(色を変えたりフォントサイズを変更したりする)
   *@param { object } clickObject - クリック時の情報が入ったオブジェクト
   */
  function elementSettingOnButtonClicked( clickObject ) {

    //要素の生成
    let showTarget = clickObject.target.parentElement.parentElement,
        settingMenu = createElementAndSetAttribute( 'div', { 'class': 'box__headline--setting' } ),
        yellowBtn = createElementAndSetAttribute( 'i', { 'class': 'box__headline--setting-color-btn box__color--yellow', 'role': 'button', 'aria-hidden': 'true', 'title': 'change yellow' } ),
        blueBtn = createElementAndSetAttribute( 'i', { 'class': 'box__headline--setting-color-btn box__color--blue', 'role': 'button', 'aria-hidden': 'true', 'title': 'change blue' } ),
        pinkBtn = createElementAndSetAttribute( 'i', { 'class': 'box__headline--setting-color-btn box__color--pink', 'role': 'button', 'aria-hidden': 'true', 'title': 'change pink' } ),
        greenBtn = createElementAndSetAttribute( 'i', { 'class': 'box__headline--setting-color-btn box__color--green', 'role': 'button', 'aria-hidden': 'true', 'title': 'change green' } ),
        grayBtn = createElementAndSetAttribute( 'i', { 'class': 'box__headline--setting-color-btn box__color--gray', 'role': 'button', 'aria-hidden': 'true', 'title': 'change gray' } ),
        //largerTxtBtnの'title': 'larger'はfontSizeChangeOnBtnClicked()のイベントでフラグとして使用しているので消しては駄目
        largerTxtBtn = createElementAndSetAttribute('i', { 'class': 'fa fa-search-plus', 'role': 'button', 'aria-hidden': 'true', 'title': 'larger' }),
        //smallerTxtBtnの'title': 'smaller'はfontSizeChangeOnBtnClicked()のイベントでフラグとして使用しているので消しては駄目
        smallerTxtBtn = createElementAndSetAttribute('i', { 'class': 'fa fa-search-minus', 'role': 'button', 'aria-hidden': 'true', 'title': 'smaller' }),
        closeBtn = createElementAndSetAttribute( 'i', { 'class': 'fa fa-times', 'role': 'button', 'aria-hidden': 'true', 'title': 'close' } );

    //閉じるボタンを押した時にメニューバーをremoveする
    closeBtn.addEventListener('click', function ( clickObject ) {

      showTarget.removeChild( clickObject.target.parentElement );

    });

    //色のボタンに付箋要素の背景色を変更するイベントを設置
    yellowBtn.addEventListener('click', colorChangeOnBtnClicked );
    blueBtn.addEventListener('click', colorChangeOnBtnClicked );
    pinkBtn.addEventListener('click', colorChangeOnBtnClicked );
    greenBtn.addEventListener('click', colorChangeOnBtnClicked );
    grayBtn.addEventListener('click', colorChangeOnBtnClicked );

    //テキスト拡大ボタンを押した時にフォントサイズを変更するイベントを設置
    largerTxtBtn.addEventListener( 'click', fontSizeChangeOnBtnClicked );
    smallerTxtBtn.addEventListener( 'click', fontSizeChangeOnBtnClicked );

    //メニューバーをドラッグした時に付箋要素が移動するようにイベントを追加
    settingMenu.addEventListener( 'mouseover', elementMoveOnSettingDrug );
    settingMenu.removeEventListener( 'mouseout', elementMoveOnSettingDrug );

    //settingMenuにボタン要素を格納
    settingMenu = appendElements( settingMenu, [ yellowBtn, blueBtn, pinkBtn, greenBtn, grayBtn, largerTxtBtn, smallerTxtBtn, closeBtn ] );
    //画面にメニューを表示する
    appendElements( showTarget, [ settingMenu ] );

    /**
     *ホバー時に付箋要素を移動させる
     *メニューバーの子要素の場合は付箋要素の移動イベントを削除する
     *@param { object } mouseoverObject - mouseover時の情報が入ったオブジェクト
     */
    function elementMoveOnSettingDrug(mouseoverObject) {

      //ホバー時のターゲットが子要素を含む場合はメニューバーなので移動イベントを追加、子要素を含まない場合はボタンなのでイベントを削除
      ( mouseoverObject.target.children.length > 0 ) ?
        this.addEventListener( 'mousedown', elementMoveOnDrug ) :
        this.removeEventListener( 'mousedown', elementMoveOnDrug );

    }//--- end elementMoveOnSettingDrug()

    /**
     *色のボタンがクリックされたときに付箋要素の背景色を変更する
     *@param { object } clickObject - クリック時の情報が入ったオブジェクト
     */
    function colorChangeOnBtnClicked( clickObject ) {

      //クリックしたボタンから背景色を定義するクラス名を取り出す
      let materialClassList = clickObject.target.classList,
          matchKeyWord = /^box__color--/,
          applyClassName = '';

      //ループ処理の中で'box__color--'で始まるクラス名があればapplyClassNameに格納
      for ( let i = 0; i < materialClassList.length; i++ ) {

        if ( materialClassList[ i ].match( matchKeyWord ) ) {
          applyClassName = materialClassList[ i ];
        }

      }

      //付箋要素に適用されている背景色を定義するクラス名を調べる
      let targetElement = clickObject.target.parentElement.parentElement,
          targetClassList = targetElement.classList,
          removeClassName = '';

      //ループ処理の中で'box__color--'で始まるクラス名があればremoveClassNameに格納
      for (let i = 0; i < targetClassList.length; i++ ) {

        if ( targetClassList[ i ].match( matchKeyWord ) ) {
          removeClassName = targetClassList[ i ];
        }

      }

      //付箋要素からremoveClassNameを削除しapplyClassNameを適用する
      targetElement.classList.remove( removeClassName );
      targetElement.classList.add( applyClassName );

    }//--- colorChangeOnBtnClicked()

    /**
     *テキスト拡大ボタンが押された時に付箋要素のテキストを大きくする
     *@param { object } clickObject - クリック時の情報が入ったオブジェクト
     */
    function fontSizeChangeOnBtnClicked( clickObject ) {

      let fontSizeDirection = clickObject.target.title;

      //スタイルの適用対象要素と現在のフォントサイズを取得
      let targetElementStyle = clickObject.target.parentElement.previousElementSibling.style,
          currentFontSize = targetElementStyle.fontSize,
          currentFontSizeValue = Number( currentFontSize.replace( /rem/, '' ) ),
          unitOfFontSize = 'rem';

      switch (fontSizeDirection) {

        //フォントサイズを多くする処理
        case 'larger':
          //多きなりすぎないようにガード
          applyFontSizeValue = (currentFontSizeValue < 4) ?
            currentFontSizeValue + 0.25 :
            currentFontSizeValue + 0;
          break;

        //フォントサイズを小さくする処理
        case 'smaller':
          //小さくなりすぎないようにガード
          applyFontSizeValue = (currentFontSizeValue > 1) ?
            currentFontSizeValue - 0.25 :
            currentFontSizeValue + 0;
          break;

        //関数の初めにfontSizeDirectionの値を調べているのでdefaultは設定しない

      }

      //要素に新たなフォントサイズを適用
      targetElementStyle.fontSize = applyFontSizeValue + unitOfFontSize;

    }//--- fontSizeChangeOnBtnClicked()

  }//--- end elementSettingOnButtonClicked()

  /**
   *付箋要素がクリックされたときに他の要素よりも表示を手前にする
   *@param { object } mousedownObject - クリック時の情報が入ったオブジェクト
   */
  function controlZIndexOnBoxMousedown( mousedownObject ) {

    //クリックイベントが設定された要素のidを取得する
    let mousedownBoxId = this.id;
    //画面に表示されている付箋要素の一覧を取得
    let boxElements = SCREEN_TARGET.children;

    //付箋要素の一覧をループで回す
    for ( let i = 0; i < boxElements.length; i++ ) {

      let thisBox = boxElements[ i ];

      //クリックイベントが設定された要素のidと一致した場合に手前に表示する
      thisBox.style.zIndex = ( thisBox.id === mousedownBoxId ) ? 101: 100;

    }

  }//--- end controlZIndexOnBoxMousedown()

  /**
   *removeボタンが押されたときに要素をremoveする
   *@param { object } clickObject - クリック時の情報が入ったオブジェクト
   */
  function elementRemoveOnButtonClicked( clickObject ) {

    //削除する対象となる要素を取得
    let removeElement = clickObject.target.parentElement.parentElement;

    //画面から削除する
    SCREEN_TARGET.removeChild(removeElement);

    //全ての子要素がなくなったときにはlenghtが0になるので新たな付箋要素を生成して表示する
    if ( SCREEN_TARGET.children.length === 0 ) {

      //情報を記憶する要素が全てなくなるのでローカルストレージをクリア
      STORAGE.clear();

      //新たな付箋要素を作成して表示する
      let uniqueId = createUniqueId();
      appendElements( SCREEN_TARGET, [ createBox( uniqueId ) ] );

    }

  }//--- end elementRemoveOnButtonClicked()

  /**
   *createElementAndSetAttributeは引数を元にhtml要素を返す
   *@param { string } tagName - 生成する要素のタグ名
   *@param { object } attributes - 要素にセットされる属性 / keyは属性名でvalueは属性値
   *@return { object } tagNameを要素名としattributesが属性としてセットされたhtml要素
   */
  function createElementAndSetAttribute( tagName, attributes ) {

    //引数のデータ型が期待通りかどうかを判定
    if ( typeof tagName !== 'string' ) throw new Error( 'In createElementAndSetAttribute() at "tagName" must be string' );
    if ( typeof attributes !== 'object' )  throw new Error( 'In createElementAndSetAttribute() at "attributes" must be object' );

    //要素を生成
    let element = document.createElement( tagName );

    //attributesを要素に設定
    for ( const key in attributes ) {

      element.setAttribute( key, attributes[ key ] );

    }

    //要素を返す
    return element;

  }//--- end createElementAndSetAttribute()

  /**
   *appendElementsはtargetElementに対してmaterialElementsをループで回してappendchildする
   *@param { object } targetElement - appendchildの対象となる要素
   *@param { array } materialElements - appendChildの素材となる要素軍群
   */
  function appendElements( targetElement, materialElements ) {

    //引数のデータ型が期待通りかどうかを判定
    if ( typeof targetElement !== 'object' ) throw new Error( 'In appendElement() at "targetElement" must be object' );
    if ( materialElements instanceof Array !== true ) throw new Error( 'In appendElement() at "materialElements" must be array' );

    //targetElementに対してmaterialElementsをループで回してappendchildする
    for ( const key in materialElements ) {
      targetElement.appendChild( materialElements[ key ] );
    }

    //targetElementを返す
    return targetElement;

  }//--- end appendElements()


  /**
   *@param { string } keyId - 配列に対して操作をする鍵となるid
   *@param { string } order - 値が'push'の場合は配列に追加、'pop'の場合は配列から削除
   */
  function controlIdsToLocalStorage( keyId, order ) {

    //渡ってくる引数が期待通りかどうかを判定するガード節
    if ( typeof keyId !== 'string' ) throw new Error( 'In controlIdsToLocalStorage() at "keyId" must be string' );
    if ( order !== 'push' && order !== 'pop' ) throw new Error( 'In controlIdsToLocalStorage() at "order" must be string / push or pop' );

    //orderが'push'の場合はBOX_IDSにkeyIdを追加、orderが'pop'の場合はBOX_IDSからkeyIdを削除
    switch ( order ) {
      case 'push':
        BOX_IDS.push( keyId );
        break;
      case 'pop':
        BOX_IDS.pop( keyId );
        break;

      //orderが'push'か'pop'以外の場合はガードしているのでdefaultは設定しない
    }

    //ローカルストレージに配列は格納できないので、json形式に変換してから格納
    STORAGE.IDS = JSON.stringify( BOX_IDS );

  }//--- end controlIdsToLocalStorage()

  /**
   *idを元に付箋要素の表示情報を取得し、ローカルストレージに保存する
   *@param { string } saveTargetId - 付箋要素を特定するためのid
   */
  function saveBoxValueToLocalStorage( saveTargetId ) {

    //渡ってくる引数が期待通りかどうかを判定するガード節
    if ( typeof saveTargetId !== 'string' ) throw new Error( 'In saveBoxValueToLocalStorage() at "saveTargetId" must be string' );

    //情報を取得するために鍵となる要素を取得
    let savedTargetWrapper = document.getElementById( saveTargetId ),
        savedTextareaElement = savedTargetWrapper.lastElementChild;

    //idを持つ要素が見つからなかったときのためのガード節
    if ( savedTargetWrapper.length === 0 ) throw new Error( ' In saveBoxValueToLocalStorage() don\'t found element of this id' );

    //背景色を定義するクラス名を探す
    let currentClassList = savedTargetWrapper.classList,
        matchKeyWord = /^box__color--/,
        saveClassName = '';

    for ( let i = 0; i < currentClassList.length; i++ ) {

      if ( currentClassList[ i ].match( matchKeyWord ) ) {

        saveClassName = currentClassList[ i ];

      }

    }

    //情報を格納したオブジェクトを作成する
    let targetIdStatus = {
      'clientLeft': savedTargetWrapper.clientLeft,      //画面の左端からの距離
      'clientTop': savedTargetWrapper.clientTop,        //画面の上端からの距離
      'className': saveClassName,                       //背景色を定義するクラス名
      'clientWidth': savedTextareaElement.clientWidth,  //テキストエリアの横幅
      'clientHeight': savedTextareaElement.clientHeight,//テキストエリアの縦幅
      'value': savedTextareaElement.value,              //テキストエリアの値
    };

    STORAGE.setItem( saveTargetId, JSON.stringify( targetIdStatus ) );

  }//--- saveBoxValueToLocalStorage()

  /**
   *applyKeyIdを元にローカルストレージから情報を取り出し、applyKeyIdに対応した要素にスタイルを適用する
   *@param { string } applyKeyId - 適用する要素のid、ローカルストレージから呼び出すプロパティとしても使う
   */
  function applyBoxValueFromLocalStorage( applyKeyId ) {

    //渡ってくる引数が期待通りかどうかを判定するガード節
    if ( typeof applyKeyId !== 'string' ) throw new Error( 'In applyBoxValueFromLocalStorage() at "applyKeyId" must be string' );

    //ローカルストレージから情報を取得
    let applyObject = JSON.parse(STORAGE.getItem(applyKeyId)),
        applyTargetWrapper = document.getElementById( applyKeyId ),
        applyTextareaElement = applyTargetWrapper.lastElementChild;

    //背景色を定義するクラス名を探す
    let currentClassList = applyTargetWrapper.classList,
    matchKeyWord = /^box__color--/,
    removeClassName = '';

    for ( let i = 0; i < currentClassList.length; i++ ) {

      if ( currentClassList[ i ].match( matchKeyWord ) ) {

        removeClassName = currentClassList[ i ];

      }

    }

    for ( let key in applyObject ) {

      switch ( key ) {
        //画面の左からの表示位置を適用
        case 'clientLeft':
          applyTargetWrapper.style.left = applyObject[ key ];
          break;
        //画面の上からの表示位置を適用
        case 'clientTop':
          applyTargetWrapper.style.top = applyObject[ key ];
          break;
        //背景色を定義するクラス名を適用
        case 'className':
          applyTargetWrapper.classList.remove( removeClassName );
          applyTargetWrapper.classList.add( applyObject[ key ] );
          break;
        //横幅を適用する
        case 'clientWidth':
          applyTextareaElement.style.width = applyObject[ key ];
          break;
        //高さを適用する
        case 'clientHeight':
          applyTextareaElement.style.height = applyObject[ key ];
          break;
        //値を適用する
        case 'value':
          applyTextareaElement.value = applyObject[ key ];
          break;
        //想定外のときはエラーを出す
        default:
          throw new Error( 'In applyBoxValueFromLocalStorage() prop of applyObject is unexpected' );
          break;

      }

    }

  }//--- end applyBoxValueFromLocalStorage()

})();