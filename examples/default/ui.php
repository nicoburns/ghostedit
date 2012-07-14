<?php/* UI markup for GhostEdit 1.0-beta2
Copyright (C) 2010-2012 Nico Burns

I've put this UI code in a seperate file simply to make the code more organised and easier to read.
The $ImageRoot variable is set in the index.php file.
*/ ?>

<!-- UI code: entire contents of '#ghostedit_editorchrome' are extracted and stored in a variable when ghostedit starts (this is to help support multiple instances is that ever gets developed) -->
<div id='ghostedit_editorchrome' style='display: none'>
	<div id='ghostedit_toolbar' class='ghostedit_toolbar'>

                <!-- TOOLBAR QUICK BUTTONS -->
                <img class='ghostedit_toolbar_quickbutton' src='<?php echo $ImageRoot; ?>/save16.png' alt='Save' title='Save' onclick='ghostedit.inout.save()' />
                <img class='ghostedit_toolbar_quickbutton' src='<?php echo $ImageRoot; ?>/undo16.png' alt='Undo' title='Undo' onclick='ghostedit.history.undo()'  />
                <img class='ghostedit_toolbar_quickbutton' src='<?php echo $ImageRoot; ?>/redo16.png' alt='Redo' title='Redo' onclick='ghostedit.history.redo()'  />
                
                <div id='ghostedit_toolbar_quickbutton_insertanchor' style='float: left; position: relative; width: 3px;height: 16px;'></div>

		<!-- TOOLBAR TABS (the actual clickable tabs, a "tab" and a "panel" are needed for a useable UI element) 
		the enabled class makes the tab visible (image and link tabs are disabled at the start, and are enabled by the script when they are useful)
		-->
		<!--<div class='ghostedit_toolbartab enabled ghostedit_toolbartab_settings' id='ghostedit_toolbartab_settings' onclick='ghostedit.ui.toolbar.clicktab(this)'>
		        <img src='<?php echo $ImageRoot; ?>/cog16.png' />
		</div>-->
		
		<div class='ghostedit_toolbartab enabled active' id='ghostedit_toolbartab_format' onclick='ghostedit.ui.toolbar.clicktab(this)'>Format
			<div id='ghostedit_toolbar_tabselect' style='position: absolute;width: 100%;left: 0; bottom: -1px; height: 1px; line-height: 1px; font-size: 1px; background-color: #FFF;'></div>
		</div>
		<div class='ghostedit_toolbartab enabled' id='ghostedit_toolbartab_insert' onclick='ghostedit.ui.toolbar.clicktab(this)'>Insert</div>
		<div class='ghostedit_toolbartab enabled' id='ghostedit_toolbartab_save' onclick='ghostedit.ui.toolbar.clicktab(this)'>Save</div>
		<!--<div class='ghostedit_toolbartab enabled' id='ghostedit_toolbartab_help' onclick='ghostedit.ui.toolbar.showtab(this)'>Help</div>-->
		<div class='ghostedit_toolbartab' id='ghostedit_toolbartab_image' onclick='ghostedit.ui.toolbar.clicktab(this)'>Image</div>
		<div class='ghostedit_toolbartab' id='ghostedit_toolbartab_link' onclick='ghostedit.ui.toolbar.clicktab(this)'>Link</div>


		<!-- TOOLBAR MESSAGE AREA (you probably want to leave this bit alone) -->
		<div id='ghostedit_messagearea'>&nbsp;</div>



		<!-- TOOLBAR PANELS (The UI elements shown when a tab is clicked)
		To add a new panel/tab, just make sure that they have the same id suffix
		-->
		
		<!-- SETTINGS PANEL -->
		<div class='ghostedit_toolbarpanel' id='ghostedit_toolbarpanel_settings'>
                        <span class='ghostedit_toolbarpanelgroup'>
                                Help here
                        </span>
                        <span class='ghostedit_toolbarseperator'></span>
                        <span class='ghostedit_toolbarpanelgroup'>
                                More help, lots and lots and lots of it.
                        </span>
                        <span class='ghostedit_toolbarseperator'></span>
                        <span class='ghostedit_toolbarpanelgroup'>
                                <img src='<?php echo $ImageRoot; ?>/about.png' alt='About' title='About GhostEdit & credits' onclick='ghostedit.ui.modal.showabout()' />
                        </span>
                </div>
                
		<!-- FORMAT PANEL -->
		<div class='ghostedit_toolbarpanel active' id='ghostedit_toolbarpanel_format'>
			
			<span class='ghostedit_toolbarpanelgroup' style='padding-top: 3px;'>
                                <img src='<?php echo $ImageRoot; ?>/format-bold.png' id='boldButton' alt='Bold' title='Bold' onclick='ghostedit.format.bold();' />
                                <img src='<?php echo $ImageRoot; ?>/format-italic.png' id='italicButton' alt='Italic' title='Italic' onclick='ghostedit.format.italic();' />
                                <img src='<?php echo $ImageRoot; ?>/format-underline.png' id='underlineButton' alt='Underline' title='Underline' onclick='ghostedit.format.underline();' />
                                <img src='<?php echo $ImageRoot; ?>/format-strikethrough.png' id='strikethroughButton' alt='Strikethrough' title='Strikethrough' onclick='ghostedit.format.strikethrough();' />
                                <br />
                                <!--<span style='height: 2px;line-height: 2px;width: 40px;'></span>
                                <br style='display: none;_display: inline' />-->
                                <img src='<?php echo $ImageRoot; ?>/align-left.png' id='alignleftButton' alt='Align Left' title='Align Left' onclick='ghostedit.format.alignText("left")' />
                                <img src='<?php echo $ImageRoot; ?>/align-center.png' id='aligncenterButton' alt='Align Center' title='Align Center' onclick='ghostedit.format.alignText("center")' />
                                <img src='<?php echo $ImageRoot; ?>/align-right.png' id='alignrightButton' alt='Align Right' title='Align Right' onclick='ghostedit.format.alignText("right")' />
                                <img src='<?php echo $ImageRoot; ?>/align-justified.png' id='alignjustifyButton' alt='Justify' title='Justify' onclick='ghostedit.format.alignText("justify")' />
                        </span>
                        
                        
                        <span class='ghostedit_toolbarseperator'></span>
                        <span class='ghostedit_toolbarpanelgroup' style='padding-top: 3px';>
                                <img src='<?php echo $ImageRoot; ?>/list-unordered.png' id='bulletedlistButton' alt='Bulleted list' title='Bulleted list' onclick='ghostedit.list.toggle("unordered");' />
                                <img src='<?php echo $ImageRoot; ?>/list-ordered.png' id='numberedlistButton' alt='Numbered list' title='Numbered list' onclick='ghostedit.list.toggle("ordered");' />
                        </span>
			
			
			<span class='ghostedit_toolbarseperator'></span>
			<span id='ghostedit_toolbar_formatboxcontainer' class='ghostedit_toolbarpanelgroup'>
				<div class='ghostedit_toolbar_formatbox' id='ghostedit_toolbar_formatpbox' onclick='ghostedit.format.setTagType("p")'>
					<p class='ghostedit_toolbar_formatbox_preview'>AaBbCc</p>
					<div class='ghostedit_toolbar_formatbox_label'>Paragraph</div>
				</div>
				<div class='ghostedit_toolbar_formatbox' id='ghostedit_toolbar_formatleadingparabox' onclick='ghostedit.format.setTagType("p","LeadingParagraph")'>
					<p class='ghostedit_toolbar_formatbox_preview LeadingParagraph'>AaBbCc</p>
					<div class='ghostedit_toolbar_formatbox_label'>LeadPara</div>
				</div>
				<div class='ghostedit_toolbar_formatbox' id='ghostedit_toolbar_formath1box' onclick='ghostedit.format.setTagType("h1")'>
					<h1 class='ghostedit_toolbar_formatbox_preview'>AaBbCc</h1>
					<div class='ghostedit_toolbar_formatbox_label'>Heading 1</div>
				</div>
				<div class='ghostedit_toolbar_formatbox' id='ghostedit_toolbar_formath2box' onclick='ghostedit.format.setTagType("h2")'>
					<h2 class='ghostedit_toolbar_formatbox_preview'>AaBbCc</h2>
					<div class='ghostedit_toolbar_formatbox_label'>Heading 2</div>
				</div>
				<div class='ghostedit_toolbar_formatbox' id='ghostedit_toolbar_formath3box' onclick='ghostedit.format.setTagType("h3")'>
					<h3 class='ghostedit_toolbar_formatbox_preview'>AaBbCc</h3>
					<div class='ghostedit_toolbar_formatbox_label'>Heading 3</div>
				</div>
			</span>
				
			<!-- UI control for setting the CSS 'clear' value of a paragraph (hidden by default because it's confusing to novice users)
			     Note that changing the clear value of a paragraph also changes the clear value of associated images.
			     If you have any idea about how to make float clearing intuitive, or what a good clearing UI would look like then please let me know! -->
			     
			<span class='ghostedit_toolbarseperator' style='display: none'></span>
			<span class='ghostedit_toolbarpanelgroup' style='display: none'>
				<select id='ghostedit_toolbar_clearselect' onchange='ghostedit.image.setClear(this.value);'>";
					<option value=''>Clear: none</option>
					<option value='left' >Clear: left</option>
					<option value='right'>Clear: right</option>
					<option value='both'>Clear: both</option>
				</select>
			</span>
			
			<!-- End CSS 'clear' UI control' -->
		</div>
		
		<!-- INSERT PANEL -->
		<div class='ghostedit_toolbarpanel' id='ghostedit_toolbarpanel_insert'>
			<span class='ghostedit_toolbarpanelgroup'>
				<img src='<?php echo $ImageRoot; ?>/insert-link.png' alt='Insert Link' title='Insert Link' onclick='ghostedit.event.linkButtonClick()' style='margin-right: 10px;' />
				<img src='<?php echo $ImageRoot; ?>/insert-image.png' alt='Insert Image' title='Insert Image' onclick='ghostedit.event.imageButtonClick()' />
			</span>
			<span class='ghostedit_toolbarseperator'></span>
			<span class='ghostedit_toolbarpanelgroup'>
				<!-- a letters -->
				<a class='ghostedit_specialchar' onclick='ghostedit.format.insert.character(this.innerHTML)'>&#224;</a>
				<a class='ghostedit_specialchar' onclick='ghostedit.format.insert.character(this.innerHTML)'>&#225;</a>
				<a class='ghostedit_specialchar' onclick='ghostedit.format.insert.character(this.innerHTML)'>&#226;</a>
				<a class='ghostedit_specialchar' onclick='ghostedit.format.insert.character(this.innerHTML)'>&#227;</a>
				<a class='ghostedit_specialchar' onclick='ghostedit.format.insert.character(this.innerHTML)'>&#228;</a>
				<a class='ghostedit_specialchar' onclick='ghostedit.format.insert.character(this.innerHTML)'>&#229;</a>
				<!-- e letters -->
				<a class='ghostedit_specialchar' onclick='ghostedit.format.insert.character(this.innerHTML)'>&#232;</a>
				<a class='ghostedit_specialchar' onclick='ghostedit.format.insert.character(this.innerHTML)'>&#233;</a>
				<br />
				<a class='ghostedit_specialchar' onclick='ghostedit.format.insert.character(this.innerHTML)'>&#234;</a>
				<a class='ghostedit_specialchar' onclick='ghostedit.format.insert.character(this.innerHTML)'>&#235;</a>
				<!-- i letters -->
				<a class='ghostedit_specialchar' onclick='ghostedit.format.insert.character(this.innerHTML)'>&#236;</a>
				<a class='ghostedit_specialchar' onclick='ghostedit.format.insert.character(this.innerHTML)'>&#237;</a>
				<a class='ghostedit_specialchar' onclick='ghostedit.format.insert.character(this.innerHTML)'>&#238;</a>
				<a class='ghostedit_specialchar' onclick='ghostedit.format.insert.character(this.innerHTML)'>&#239;</a>
				<!-- o letters -->
				<a class='ghostedit_specialchar' onclick='ghostedit.format.insert.character(this.innerHTML)'>&#242;</a>
				<a class='ghostedit_specialchar' onclick='ghostedit.format.insert.character(this.innerHTML)'>&#243;</a>
				<br />
				<a class='ghostedit_specialchar' onclick='ghostedit.format.insert.character(this.innerHTML)'>&#244;</a>
				<a class='ghostedit_specialchar' onclick='ghostedit.format.insert.character(this.innerHTML)'>&#245;</a>
				<a class='ghostedit_specialchar' onclick='ghostedit.format.insert.character(this.innerHTML)'>&#246;</a>
				<!-- u letters -->
				<a class='ghostedit_specialchar' onclick='ghostedit.format.insert.character(this.innerHTML)'>&#249;</a>
				<a class='ghostedit_specialchar' onclick='ghostedit.format.insert.character(this.innerHTML)'>&#250;</a>
				<a class='ghostedit_specialchar' onclick='ghostedit.format.insert.character(this.innerHTML)'>&#251;</a>
				<a class='ghostedit_specialchar' onclick='ghostedit.format.insert.character(this.innerHTML)'>&#252;</a>
				<!-- spanish n
				<a class='ghostedit_specialchar' onclick='ghostedit.format.insert.character(this.innerHTML)'>&#241;</a>-->
			</span>
			<span class='ghostedit_toolbarseperator'></span>
			<span class='ghostedit_toolbarpanelgroup'>
				<a class='ghostedit_specialchar' onclick='ghostedit.format.insert.character(this.innerHTML)'>+</a>
				<a class='ghostedit_specialchar' onclick='ghostedit.format.insert.character(this.innerHTML)'>&#8722;</a>
				<a class='ghostedit_specialchar' onclick='ghostedit.format.insert.character(this.innerHTML)'>&#215;</a>
				<a class='ghostedit_specialchar' onclick='ghostedit.format.insert.character(this.innerHTML)'>&#247;</a>
				<br />
				<a class='ghostedit_specialchar' onclick='ghostedit.format.insert.character(this.innerHTML)'>&#8804;</a>
				<a class='ghostedit_specialchar' onclick='ghostedit.format.insert.character(this.innerHTML)'>&#8805;</a>
				<a class='ghostedit_specialchar' onclick='ghostedit.format.insert.character(this.innerHTML)'>&#177;</a>
				<a class='ghostedit_specialchar' onclick='ghostedit.format.insert.character(this.innerHTML)'>&#8801;</a>
				<br />
				<a class='ghostedit_specialchar' onclick='ghostedit.format.insert.character(this.innerHTML)'>&#189;</a>
				<a class='ghostedit_specialchar' onclick='ghostedit.format.insert.character(this.innerHTML)'>&#188;</a>
				<a class='ghostedit_specialchar' onclick='ghostedit.format.insert.character(this.innerHTML)'>&#190;</a>
				<a class='ghostedit_specialchar' onclick='ghostedit.format.insert.character(this.innerHTML)'>&#960;</a>
			</span>
		</div>
		
		
		<!-- SAVE PANEL -->
		<div class='ghostedit_toolbarpanel' id='ghostedit_toolbarpanel_save'>
			<span class='ghostedit_toolbarpanelgroup'>
				Page Name<br />
				<input type='text' id='ghostedit_toolbar_savename' style='width: 200px' value='<?php echo $Page->name; ?>' />
			</span>
			
			<!-- URL Slug Field
			     If you don't want a seperate URL slug field, then simply hide the seperator and panel group using 'display: none'.
			     The URl slug will still be sent to the savepage, simply ignore it.
			-->
			<span class='ghostedit_toolbarpanelgroup'>
				Page Url Slug<br />
				<input type='text' id='ghostedit_toolbar_saveurl' style='width: 200px' value='<?php echo $Page->urlslug; ?>' />
			</span>
			<!-- End URl slug field -->
			
			
			<span class='ghostedit_toolbarpanelgroup'>
				<img src='<?php echo $ImageRoot; ?>/save.png' alt='Save' title='Save' onclick='ghostedit.inout.save()' />
				<?php /*HTTPROOT + 'blog/<?php echo $Page->id; ?>/' + document.getElementById('ghostedit_toolbar_savename').value.replace(/ /g, '-')*/ ?>
			</span>
			<span class='ghostedit_toolbarseperator'></span>
			<span class='ghostedit_toolbarpanelgroup'>
				<img src='<?php echo $ImageRoot; ?>/preview.png' id='ghostedit_toolbar_button_preview' alt='Preview' title='Preview' onclick="ghostedit.inout.openPreview();" />
				<img src='<?php echo $ImageRoot; ?>/about.png' alt='About' title='About GhostEdit & credits' onclick='ghostedit.ui.modal.showabout()' />
			</span>
		</div>
		
		<!-- HELP PANEL (Will probably be enabled in the future, and will provide documentation and help to users of the editor)
		<div class='ghostedit_toolbarpanel' id='ghostedit_toolbarpanel_help'>
			<span class='ghostedit_toolbarpanelgroup'>
				Help here
			</span>
			<span class='ghostedit_toolbarseperator'></span>
			<span class='ghostedit_toolbarpanelgroup'>
				More help, lots and lots and lots of it.
			</span>
			<span class='ghostedit_toolbarseperator'></span>
			<span class='ghostedit_toolbarpanelgroup'>
				<img src='<?php echo $ImageRoot; ?>/about.png' alt='About' title='About GhostEdit & credits' onclick='ghostedit.ui.modal.showabout()' />
			</span>
		</div>-->
		
		<!-- IMAGE PANEL -->
		<div class='ghostedit_toolbarpanel' id='ghostedit_toolbarpanel_image'>
			<span class='ghostedit_toolbarpanelgroup'>
				<!--Image Source<br />
				<input id='ghostedit_toolbar_imagesrc' type='text' style='width: 300px' />-->
				<img src='<?php echo $ImageRoot; ?>/edit.png' alt='Change Image Source' title='Change Image Source' onclick='ghostedit.image.srcdialog()' />
			</span>
			<span class='ghostedit_toolbarseperator'></span>
			<span class='ghostedit_toolbarpanelgroup'>
				Description / Alt Text<br />
				<input id='ghostedit_toolbar_imagealttext' type='text' style='width: 200px' onkeyup='ghostedit.image.updatealttext(this.value);' onkeydown='ghostedit.util.preventBubble(event)' onkeydown='ghostedit.util.preventBubble(event)' onclick='ghostedit.util.preventBubble(event);' onkeypress='ghostedit.util.preventBubble(event);'  />
			</span>
		</div>
		
		<!-- LINK PANEL -->
		<div class='ghostedit_toolbarpanel' id='ghostedit_toolbarpanel_link'>
			<!--<span class='ghostedit_toolbarpanelgroup'>
				<img src='<?php echo HTTPROOT; ?>static/images/cc/black/png/delete_icon&48.png' alt='Remove Link' title='Remove Link' onclick='ghostedit.link.remove()' />
			</span>
			<span class='ghostedit_toolbarseperator'></span>-->
			<span class='ghostedit_toolbarpanelgroup'>
				Link URL<br />
				<input id='ghostedit_toolbar_linkurl' type='text' style='width: 400px' onkeyup='ghostedit.link.updateurl(this.value);' onkeydown='ghostedit.util.preventBubble(event)' onkeypress='ghostedit.util.preventBubble(event)' />
			</span>
			<span class='ghostedit_toolbarpanelgroup'>
				<img src='<?php echo $ImageRoot; ?>/openlink.png' alt='Open link in new tab' title='Open link in new tab' onclick='ghostedit.link.open()' />
			</span>
		</div>
	</div>
	
	<!-- THE EDITABLE AREA (now added programatically)
	<div id='ghostedit_editdiv' class='ghostedit_editdiv' contenteditable='true'></div>-->
	
	<!-- 'status' bar -->
	<div id='ghostedit_statusbar' class='ghostedit_statusbar'><b>Path:</b></div>
	
	<!-- IMAGE KEYCAPTURE FORM (used to capture keyboard events when an image is selected -->
	<form id='ghostedit_imgfocusForm' style='margin:0px;padding:0px;height:0px;width:0px;overflow:hidden;line-height: 0px'><textarea id='ghostedit_imagekeycapture' onkeypress='return ghostedit.util.cancelEvent(event)' onkeydown='return ghostedit.event.imageKeydown(event)'></textarea></form>
	
	<!-- MODAL DIVS (made visible and populated with content when a modal dialog is created) -->
	<div id='ghostedit_modalbg' class='ghostedit-modal-bg' onclick='ghostedit.ui.modal.hide()'></div>
	<div id='ghostedit_modal' class='ghostedit-modal'></div>
</div>
<!-- end UI code -->
