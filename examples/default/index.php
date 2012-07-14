<?php/* Demo setup page for GhostEdit 1.0-beta2
Copyright (C) 2010-2012 Nico Burns

This page is designed to show you how to use GhostEdit. It is well commented, and fairly short, so it is recommended that you look through all of it.
The UI markup is seperated out into a seperate file for neatness.
*/ ?>
<h1>Ghostedit Demo Page</h1><p>This page is designed to demonstrate how to set up GhostEdit.</p>
<?php

//Image root variable - defines the base url for the ghostedit icons. i.e. the folder that the contents of the images folder are in.
//Used in the UI file, and passed to the GhostEdit script as a parameter.
$ImageRoot = "images/"; //e.g. http://mysite.com/images/ghostedit/

// Create page object for neat storage of page data
$Page = new stdClass();

//Get pageid from GET, or default to 1
$Page->id = isset($_GET['pageid']) && ctype_digit($_GET['pageid']) ? $_GET['pageid'] : 1;

/* Retrieve page content from flat-file store, and set other page variables to arbitary values
	You will want to change this section to retreive data from your actual backend */
$Page->content = file_get_contents("savedpages/" . $Page->id . ".htm");
$Page->name = "My first page";
$Page->url = "http://example.com/blog/my-first-page";
$Page->urlslug = "my-first-page";

?>

<!-- Include the GhostEdit stylesheet - contains things such as toolbar and other UI element layout styles -->
<link rel='stylesheet' media='screen' href='ghostedit.css' />


<!-- Output content to a div, the id 'ghostedit' is arbitary and is passed to the function later. It is hidden as the editor copies the content, and it would display twice otherwise. -->
<div id='ghostedit' style='display: none'>
	<?php if($Page->content != null) echo stripslashes(strip_tags($Page->content,"<p><b><i><u><a><img><strike><h1><h2><h3><h4><h5><h6><br><ol><ul><li>")); ?>
</div>


<!-- Include the UI markup (in a seperate file because it's messy, and it makes this file easier to read -->
<?php include("ui.php"); ?>




<!-- Include scripts: the lasso selection and range library, and the main ghostedit file (minified together in the same file) -->

<!--  [Broken minified file]
        <script src='ghostedit-1.0-beta1+lasso.min.js' type='text/javascript'></script>-->

<!-- use source files insted for now -->
<script src='../../lib/lasso-1.2.0.js' type='text/javascript'></script>
<script src='../../src/ghostedit.js' type='text/javascript'></script>



<script type='text/javascript'>
	
	/* Demo Options variable containing (and explaining) all options
	var opt = {
		imageroot: "<?php echo $ImageRoot; ?>",						/// [required] The base url of the ghostedit images folder, used for loading the resize handles.
		saveurl: "<?php echo HTTPADMIN; ?>articles/savearticle/", 		// [required] URL to the save page.
		saveparams: ["id=<?php echo $Page->id; ?>", "foo=bar"],			// [optional] Array of extra parameters which are sent as POST variables to the save page e.g. pageid=27
		disableimageresize: false,									// [optional] [default: false] Disables the image resize handle, useful if you only want to allow certain image sizes
		defaultimageclass: "small",									// [optional] Allows you to set a class to be applied to all images by default
		uploadedimages: [],											// [optional] Allows you to pass an array of images to populate the image selector with
		previewurl: "<?php echo $Page->url; ?>"						// [optional] URL which is opened if the preview button is pressed (preview button will be hidden if no URL is specified)
	}*/
	
	/* The 'uploadedimages' param takes an array of objects in the following form:
	   It will display the thumbnail and name in the selection UI, and insert the image specified in 'url'
	{
		id: "id of image",
		name: "Name to be displayed in UI.",
		url: "http://lala/path/to/fullsizeimage.jpg",
		thumbnail: "http://lala/path/to/thumbnail.jpg"
	}
	*/
	
	// The actual options used in the demo
	// Make sure there is no comma after the last option or it will break ie6
	var opt = {
                imageroot: "<?php echo $ImageRoot; ?>",
                saveurl: "savepage.php",
                saveparams: ["id=<?php echo $Page->id; ?>", "foo=bar"],
                debug: true
        }
        
        
        /*
        ghostedit.init('ghostedit', {
                imageroot: "ghostedit-images/",
                saveurl: "savepage.php",
                saveparams: ["id=1", "foo=bar"],
                debug: true
        })
        */
	
	// ghostedit.init function is passed the id of the div containing the starting content and the options object.
	ghostedit.init('ghostedit', opt);
	
</script>
