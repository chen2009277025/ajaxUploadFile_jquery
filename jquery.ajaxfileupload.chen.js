/***
 * Created by chenjianhui on 15/12/15.
 */

(function ($) {
    $.fn.ajaxfileupload_chen = function (options) {

        /**
         *
         * @type {{params: {}, action: string, onStart: Function, onComplete: Function, onCancel: Function, validate_extensions: boolean, valid_extensions: string[], accessFileName: string, submit_button: null, limitSizeList: null}}
         */
        var settings = {
            params: {},
            action: '',
            onStart: function () {
            },
            onSuccess: function (response, img) {

            },
            onComplete: function (response) {

            },
            onCheckSuccess: function (isOkImgList) {

            },
            onCancel: function () {
            },
            validate_extensions: true,//后缀名是否合法
            valid_extensions: ['gif', 'png', 'jpg', 'jpeg'],//允许的文件格式
            accessFileName: "new_file",//服务端接受的文件名
            submit_button: null,//提交按钮
            imgSizeList: null//尺寸限制
        };

        var uploading_file = false;

        //准备上传的文件
        //格式{file:file,status:0}//status:0未上传,1:已经上传
        var fileReadyUpload = null;

        //检查时候错误文件
        var err_files_num = 0;
        //检查时候正确文件
        var success_files = 0;
        //检查文件时候重复文件
        var replace_file_num = 0

        //保存上下文对象
        var _context = this;

        //准备好的图片
        var isOkImgList = null;

        if (options) {
            $.extend(settings, options);
        }

        // 'this' is a jQuery collection of one or more (hopefully)
        //  file elements, but doesn't check for this yet
        return this.each(function () {

            var $element = $(this);

            // Skip elements that are already setup. May replace this
            //  with uninit() later, to allow updating that settings
            if ($element.data('data-setup') === true) return;

            $element.change(function () {
                // 重置变量
                uploading_file = false;
                success_files = 0;
                err_files_num = 0;
                replace_file_num = 0;

                if ($(this).val() == "") {
                    return;
                }

                //检查文件格式
                var ext = $(this).val().split('.').pop().toLowerCase();
                if (true === settings.validate_extensions && $.inArray(ext, settings.valid_extensions) == -1){
                    settings.onComplete.apply($element, [{
                        code: 9,
                        msg: '选中的文件格式应该是:' + settings.valid_extensions.join(', ') + '.'
                    }, settings.params]);
                }

                var files = $element[0].files;
                var img_clock = files.length;//上传图片计数器
                for (var i = 0; i < files.length; i++) {
                    var file = files[i];
                    (function (file) {
                        var oFReader = new FileReader();
                        oFReader.onload = function (oFREvent) {
                            var img = new Image();
                            img.src = oFREvent.target.result;

                            img.onload = function () {
                                //调用检查图片尺寸的地方
                                checkImgSize(this, file);
                                img_clock--;
                                if (img_clock <= 0) {
                                    //表示最后一张图片
                                    reSetUploadImgs($element);
                                }
                            }

                        };
                        try {
                            oFReader.readAsDataURL(file);
                        } catch (e) {
                            console.log(e.message);
                        }
                    })(file);
                }

            });

            if (settings.submit_button == null) {
                // do nothing
            } else {
                settings.submit_button.click(function (e) {
                    // Prevent non-AJAXy submit
                    e.preventDefault();
                    // 如果有上传按钮,而且不在上传过程中,则上传
                    if (!uploading_file) {
                        upload_file();
                    }
                });
            }

            /**
             * 上传方法
             * @returns {*}
             */
            var upload_file = function () {
                //当没有选择的文件上来的时候,也不应该返回,应该要把之前选择过得文件上传
                 if ($element.val() == '') {
                    if(fileReadyUpload == null || fileReadyUpload.length == 0){
                        return settings.onCancel.apply($element, [settings.params])
                    }else{
                        uploading_file = true;
                        //开始之前调用用户自己定义的OnStart方法
                        var ret = settings.onStart.apply($element, [settings.params]);

                        //如果Start方法没有校验通过,则不处理开始上传方法
                        if (ret !== false) {
                            //调用上传
                            uploadImgs();
                        }
                    }
                 }else{
                     //选择到了文件
                     // 校验格式后缀名
                     var ext = $element.val().split('.').pop().toLowerCase();
                     if (true === settings.validate_extensions && $.inArray(ext, settings.valid_extensions) == -1) {
                         //回传给用户
                         settings.onComplete.apply($element, [{
                             code: 9,
                             msg: '选中的文件格式应该是:' + settings.valid_extensions.join(', ') + '.'
                         }, settings.params]);
                     }else{

                         uploading_file = true;
                         //开始之前调用用户自己定义的OnStart方法
                         var ret = settings.onStart.apply($element, [settings.params]);

                         //如果Start方法没有校验通过,则不处理开始上传方法
                         if (ret !== false) {
                             //调用上传
                             uploadImgs();
                         }
                     }
                 }



            };

            /**
             * 上传文件的方法
             */
            var uploadImgs = function () {
                for (var i = 0; i < fileReadyUpload.length; i++) {
                    var file_item = fileReadyUpload[i];
                    var img_rel = isOkImgList[i];
                    (function (file_item, img_rel) {
                        var file = file_item.file;
                        if (file_item.status === 0) {//只有没有上传,才选择上传
                            var xhr = new XMLHttpRequest();
                            if (xhr.upload) {
                                // 进度条
                                xhr.upload.addEventListener("progress", function (e) {
                                    //self.onProgress(file, e.loaded, e.total);
                                    console.log("uploading");
                                }, false);

                                // 完成监听
                                xhr.onreadystatechange = function (e) {
                                    if (xhr.readyState == 4) {
                                        if (xhr.status == 200) {
                                            uploadSuccess($element,file,img_rel.img, xhr.responseText);
                                            if (!fileReadyUpload.length) {
                                                //调用自己的完成方法
                                                uploadComplete($element, xhr.responseText);
                                            }
                                        } else {
                                            uploadFailure(file, xhr.responseText);
                                        }
                                    }
                                };

                                // 制造一个form表单数据上传数据
                                var form = new FormData();
                                form.append(settings.accessFileName, file);
                                xhr.open("POST", settings.action, true);
                                xhr.setRequestHeader("X_FILENAME", encodeURIComponent(file.name));
                                xhr.send(form);
                            }
                        }
                    })(file_item, img_rel);
                }
            }

            /**
             * 上传成功
             * 单个文件上传成功
             */
            var uploadSuccess = function (element,file,img,response) {

                if (typeof response == "string") {
                    response = JSON.parse(response);
                }

                setIsUploadStatus(file,response);

                //调用sccuess方法可能需要对当个文件处理
                settings.onSuccess.apply(element, [response, img, settings.params]);
            }

            /**
             * 设置已经上传的状态
             * @param file
             */
            var setIsUploadStatus = function(file,response){
                //需要把文件上传状态修改为已经上传
                for(var i = 0 ; i < fileReadyUpload.length; i++){
                    if(fileReadyUpload[i].file == file){
                        fileReadyUpload[i].status = 1;
                        isOkImgList[i].status = 1;
                        isOkImgList[i].img_src = response.data;
                    }
                }
            }

            /***
             * 所有文件上传完成方法
             * 这个方法和Onsuccess的区别在于这个方法属于所有上传结束
             */
            var uploadComplete = function (element, response) {

                //把锁的打开,可以再一次上传
                uploading_file = false;

                //调用传进来的onComplete方法,处理用户需要处理的方法
                settings.onComplete.apply(element, [response, settings.params]);
            }


            /**
             * 上传失败
             */
            var uploadFailure = function () {

            }


            //检查上传到额文件尺寸是否符合
            var checkImgSize = function (img, file) {
                if (img == null) {
                    return;
                }
                //检查是否再允许上传的列表中
                var isOk = false;
                for (var i in settings.imgSizeList) {
                    var item = settings.imgSizeList[i];
                    if (img.width == item.width && img.height == item.height) {
                        isOk = true;
                    }
                }
                //在允许上传的尺寸列表中
                if (isOk) {
                    //往成功文件里面添加1
                    //判断已经成功的列表中是否存在该尺寸
                    if (isOkImgList != null && isOkImgList.length > 0) {
                        var isExist = false;
                        //判断图片是否已经在可以上传的列表中
                        for (var j = 0; j < isOkImgList.length; j++) {
                            var _item = isOkImgList[j].img;
                            if (img.width == _item.width && img.height == _item.height) {
                                //如果存在则保存当前上传的
                                var img_item = {img:img,status:0};
                                isOkImgList.splice(j, 1, img_item);
                                var file_item = {file: file, status: 0};
                                fileReadyUpload.splice(j, 1, file_item);
                                replace_file_num++;
                                isExist = true;
                            }
                        }
                        //如果不存在,则放入
                        if (!isExist) {
                            success_files++;
                            var img_item = {img:img,status:0};
                            isOkImgList.push(img_item);
                            var file_item = {file: file, status: 0};
                            fileReadyUpload.push(file_item);
                        }
                    } else {
                        success_files++;
                        //没有成功的图片列表
                        isOkImgList = [];
                        fileReadyUpload = [];
                        //拼装上传文件列表
                        var file_item = {file: file,status: 0};
                        fileReadyUpload.push(file_item);
                        var img_item = {img:img,status:0};
                        isOkImgList.push(img_item);
                    }
                } else {
                    err_files_num++;
                    console.log("上传的图片尺寸不符合");
                }
            }

            //重新添加图片标签
            var reSetUploadImgs = function (element) {

                //回调用户的方法设置界面
                settings.onCheckSuccess.apply(element, [isOkImgList,{success:success_files,error:err_files_num,replace:replace_file_num}]);

                if (isOkImgList == null || isOkImgList.length <= 0) {
                    return;
                }
                //检查成功,调用上传文件

                //当没有上传文件的按钮
                if (settings.submit_button == null) {
                    upload_file();
                }

            }


            // 附一个状态,标示是初始化成化工
            $element.data('data-setup', true);

        });
    }
})(jQuery)
