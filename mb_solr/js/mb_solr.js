(function ($) {
	
	function clearAllMBTrees() {
		ftrees = Drupal.settings.mediabase.ftrees;
		for(var fi = 0; fi < ftrees.length; fi++) {
			tr = ftrees[fi];
			tr.clearFilter();
		}
	}
	
	//  ndg8f 2013-11-14: Updated (2016-02-19) to load only when tab is first clicked to speed up page load.
	Drupal.behaviors.mbSolr={ 
		attach: function(context) {
			//console.log('mb solr js context:', $(context).attr('id'));
			if(context == document) { 
                // Load more related when tab is clicked
               $('#related-tab').on('show.bs.tab', function() {
                    // Ajax Service Call for More Like This Related videos
                    var data = $('div#related').data();
                    if(data != null && typeof(data.nid) != 'undefined') { 
                        if ($('#related-av-nodes .loading-img').length > 0) {
                            var nid = data.nid;
                            var ct = (typeof(data.count) != "undefined") ? '/' + data.count : '';
                            var url = Drupal.settings.basePath + 'services/mlt/' + nid + ct;
                            $('#related-av-nodes').load(url, function() { 
                                $("#related.mlt .dev-query").remove();
                                $("#related.mlt .shanti-gallery").addClass('clearfix');
                                Drupal.attachBehaviors('#related.mlt');
                            });
                        }
                    }
                    // Set height of facet block to match height of flyout
                    setTimeout(function() {
                        $('.block-facetapi').each(function() { 
                                var hgt = $(this).parent().height(); 
                                $(this).height(hgt); 
                                $(this).children('.content').height(hgt); 
                        });
                    }, 1000);
                });
		 } else if($(context).attr('id') == 'views-exposed-form-browse-media-home-block') {
		 		// Home block views ajax sort/filter request
		 		if ($('#no-views-filter-results').length > 0) {
		 				var p = jQuery('#no-views-filter-results').parents('.shanti-gallery');
		 				var cl = p.attr('class');
		 				var mtch = cl.match(/view-dom-id-([^\s]+)/); // mtch[0] is full string, mtch[1] is just alphanumeric id
		 				if(mtch && mtch.length > 1) {
			 				var vdid = 'views_dom_id:' + mtch[1];
			 				setTimeout( function() {
								Drupal.views.instances[vdid].$view.trigger('RefreshView');
							}, 1000);
						}
		 		}
		 }
	 	}
	};
	
	$.fn.clearFacetTree = function() {
		Drupal.settings.mediabase.facets = "";
		$(this).updateFacetTree();
	};
	
	// Called by ajax_command_invoke in mb_solr.module from mb_solr_facets_ajax() function. Needs to be JQuery function
	$.fn.updateFacetTree = function() {
		var fsel = Drupal.settings.mediabase.facets;
		
		if(fsel == "") {
			setTimeout(clearAllMBTrees, 500);
		}
		var ifsfids = []; //fsel.split(":").pop();
		var fcts = fsel.split("::");
		for(var n in fcts) {
			pts = fcts[n].split(":");
			if (pts[0] == "im_field_subcollection_new") {  // was im_field_subcollection replaced with new field name (ndg)
				ifsfids.push(parseInt(pts[1]));
			}
		}
		
		for(var fname in Drupal.settings.mediabase.facetcounts) {
			var flabel = fname.split('_').pop();
			if(flabel == 'characteristic') {flabel = 'subject';}
			var tree = $('.facet-' + flabel + ' .content').fancytree('getTree');
			if(typeof(tree) != 'undefined' && typeof(tree.widget) != "undefined") {
				tree.clearFilter();
				var fcounts = Drupal.settings.mediabase.facetcounts[fname];
				var root = tree.getRootNode();
				var res = root.visit(function(node) { 
					node.setSelected(false);
					node.data.count = fcounts[node.data.fid];
					return true;
				});
				if(ifsfids.length > 0) {
				  var ct = tree.filterNodes(function(node) { 
						var showit = fcounts.hasOwnProperty(node.data.fid);
						if(ifsfids.indexOf(node.data.fid) > -1) {
							node.setSelected(true);
						}
						return showit;
					});
				} else {
					var ct = tree.filterNodes(function(node) { 
						var parents = node.getParentList();
						var showit = (parents.length > 1) ? false : true;
						return showit;
					});
				}
			// Unable to find a tree
			} else {
				console.warn("No tree found to filter: " + flabel);
			}
		}
		
		// Set Page title and make last breadcrumb releoad 
		// TODO: Now it just takes first facet. Would be good to do get all facets clicked (but highlighted includes children too)
		var newtitle = $('.fancytree-selected a').text();
		if (newtitle == '') { newtitle = 'Search'; }
		newtitle = newtitle.split('(').shift();
		$('.page-title .page-title-text').text(newtitle); // Change page title to Search
		$('ol.breadcrumb li a[href="#"]').addClass('revive-pointer').click(function() {window.location.reload();}); // Add reload action to last breadcrumb
		
		Drupal.settings.mediabase.facetcounts = []; // reset facet counts so they don't get merged between calls
		if($('#tab-overview').length == 0) { 
			$htmlErr = '<article class="tab-pane main-col active" id="tab-overview"><div class="region region-content">';
			$htmlErr += '<div class="content"><h4>Search Error</h4><p>There was a problem retrieving these results. ';
			$htmlErr += 'Please try again later.</p>';
			$htmlErr += '</div></div></article>';
			$('.main-content .content-section > .tab-content').html($htmlErr); 
		}
		// Reattach Behaviors to links in tree for Firefox or else you get JSON when clicking to deselect facet (MANU-85)
		setTimeout("Drupal.attachBehaviors('.kmaps-tree');", 1000);
	};
	
	
} (jQuery));