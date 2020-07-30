export default {
  // global component name
  name: 'vue-html5-editor',
  // 是否显示模块名称，开启的话会在工具栏的图标后台直接显示名称
  // if set true,will append module name to toolbar after icon
  // 自定义各个图标的class，默认使用的是font-awesome提供的图标
  // custom icon class of built-in modules,default using font-awesome
  icons: {
    text: 'icon_pencil',
    color: 'fa fa-paint-brush',
    font: 'icon_typography',
    align: 'icon_menu',
    list: 'icon_list2',
    link: 'icon_link',
    unlink: 'icon_unlink',
    tabulation: 'icon_grid',
    image: 'icon_image',
    hr: 'fa fa-minus',
    eraser: 'icon_eraser',
    undo: 'fa-undo fa',
    'full-screen': 'fa fa-arrows-alt',
    info: 'fa fa-info'
  },
  image: {
    // 文件最大体积，单位字节  max file size
    sizeLimit: 4000 * 4000,
    // 上传参数,默认把图片转为base64而不上传
    // upload config,default null and convert image to base64
    upload: {
      url: null,
      headers: {},
      params: {},
      fieldName: {}
    },
    // 压缩参数,默认使用localResizeIMG进行压缩,设置为null禁止压缩
    // compression config,default resize image by localResizeIMG (https://github.com/think2011/localResizeIMG)
    // set null to disable compression
    compress: null,
    // 响应数据处理,最终返回图片链接
    // handle response data，return image url
    uploadHandler (responseText) {
      // default accept json data like  {ok:false,msg:'unexpected'} or {ok:true,data:'image url'}
      var json = JSON.parse(responseText)
      if (!json.ok) {
        alert(json.msg)
      } else {
        return json.data
      }
    }
  },
  // 语言，内建的有英文（en-us）和中文（zh-cn）
  language: 'ru',
  // 自定义语言
  i18n: {
    // specify your language here
    'ru': {
      align: 'Выравнивание',
      eraser: 'Удалить форматирование',
      image: 'Изображение',
      list: 'Список',
      link: 'Ссылка',
      unlink: 'Удалить ссылку',
      table: 'Таблица',
      font: 'Шрифт',
      'full screen': 'Во весь экран',
      text: 'Текст',
      info: 'Информация',
      color: 'Цвет',
      'please enter a url': 'Введите URL-адрес',
      'create link': 'Создать ссылку',
      bold: 'Жирный',
      italic: 'Курсивный',
      underline: 'Подчеркнутый',
      'strike through': 'Зачеркнутый',
      subscript: 'Подстрочный знак',
      superscript: 'Надстрочный знак',
      heading: 'Заголовок',
      'font name': 'Имя шрифта',
      'font size': 'Размер шрифта',
      'left justify': 'По левому краю',
      'center justify': 'По центру',
      'right justify': 'По правому краю',
      'ordered list': 'Упорядоченный',
      'unordered list': 'Неупорядоченный',
      'fore color': 'Цвет текста',
      'background color': 'Цвет фона',
      'row count': 'Кол-во строк',
      'column count': 'Кол-во столбцов',
      save: 'Сохранить',
      upload: 'Загрузить',
      progress: 'Прогресс',
      unknown: 'Неизвестно',
      'please wait': 'Пожалуйста, подождите',
      error: 'Ошибка',
      abort: 'Прервать',
      reset: 'Сброс',
      hr: 'Горизонтальная линия',
      undo: 'Отменить',
      'line height': 'Высота линии',
      'exceed size limit': 'Превышать ограничение по размеру'
    }
  },
  // 隐藏不想要显示出来的模块
  // the modules you don't want
  hiddenModules: [
    'info',
    'full-screen'
  ],
  // 自定义要显示的模块，并控制顺序
  // keep only the modules you want and customize the order.
  // can be used with hiddenModules together
  // visibleModules: [
  //   'text',
  //   'color',
  //   'font',
  //   'align',
  //   'list',
  //   'link',
  //   'unlink',
  //   'tabulation',
  //   'image',
  //   'hr',
  //   'eraser',
  //   'undo',
  //   'full-screen'
  // ],
  // 扩展模块，具体可以参考examples或查看源码
  // extended modules
  modules: {
  }
}
