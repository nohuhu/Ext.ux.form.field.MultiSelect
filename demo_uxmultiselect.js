/*
 * Ext.ux.form.field.MultiSelect demo application.
 *  
 * Copyright (C) 2011-2012 Alexander Tokarev.
 *  
 * This code is licensed under the terms of the Open Source LGPL 3.0 license.
 * Commercial use is permitted to the extent that the code/component(s) do NOT
 * become part of another Open Source or Commercially licensed development library
 * or toolkit without explicit permission.
 * 
 * License details: http://www.gnu.org/licenses/lgpl.html
 */

Ext.Loader.setConfig({
    enabled:        true,
    disableCaching: true,
    paths: {
        'Ext.ux':  '../ux'
    }
});

Ext.require([
    'Ext.form.Panel',
    'Ext.ux.form.field.MultiSelect'
]);

var store, panel,
    multiValue = true;

Ext.onReady(function() {
    Ext.tip.QuickTipManager.init();

	panel = Ext.create('Ext.form.Panel', {
        width:	200,
        height: 200,
        
        id: 'formPanel',
        
        layout: 'vbox',
        border: false,
        
        defaults: {
            autoScroll: true,
            bodyPadding: 8,
			listeners: {
				specialkey: function(form, event) {
					if (event.getKey() === event.ENTER) {
						form.up().down('#validateButton').handler();
					};
				}
			}
        },
        
        position: 'absolute',
        x:  20,
        y:  20,

        items: [{
            xtype: 'multiselectfield',
            id:    'multiSelectField',
            allowBlank: false,
            multiValue: multiValue,
            noneSelectedText: '<center>None selected</center>',
            store: {
                fields: [ 'id', 'name' ],
                data: [
                    { id: '1',    name: 'Alfonso Musorgsky' },
                    { id: '02',   name: 'Adam Petruccio' },
                    { id: '303',  name: 'Ben Robertson' },
                    { id: '0304', name: 'Cecilia Unknown' },
                    { id: '0305', name: 'Dieter Bohlen' },
                    { id: '0306', name: 'Elena Prekrasnaya' },
                    { id: '0307', name: 'Flora diFauna' },
                    { id: '0308', name: 'Giorgio Moglinetti' },
                    { id: '0309', name: 'Huey Lewis' },
                    { id: '0310', name: 'Ian Underwood' },
                    { id: '0311', name: 'Jamie Nothere' },
                    { id: '0312', name: 'Karl Gustaf' },
                    { id: '0313', name: 'Laura Star' },
                    { id: '0314', name: 'Monty Python' },
                    { id: '0315', name: 'Ninja Turtle' },
                    { id: '0316', name: 'Opal the Waitress' },
                    { id: '0317', name: 'Prince Charming' },
                    { id: '0318', name: 'Quin Zuhan' },
                    { id: '0319', name: 'Rahul Gamzatov' },
                    { id: '0320', name: 'Simeon Balthazar' },
                    { id: '0321', name: 'Trololo Guy' },
                    { id: '0322', name: 'Undine Brundelschpiegel' },
                    { id: '0323', name: 'Victoria Queen' },
                    { id: '0324', name: 'Walt Disney' },
                    { id: '0325', name: 'Xanthan Gum' },
                    { id: '0326', name: 'Yvonne van der Onne' },
                    { id: '0327', name: 'Zombie Hunter' }
                ],
                proxy: {
                    type: 'memory'
                },
                sorters: [{
                    sorterFn: function(a, b) {
                        var first, second;
                        
                        first  = a.get('id') - 0;       // Compare numeric
                        second = b.get('id') - 0;
                        
                        return  first  > second ?  1
                              : second > first  ? -1
                              :                    0
                              ;
                    }
                }]
            },
            
            // Overall width of selector grid is 202px
            // 20px takes first (icon) column
            // Another 16px usually takes vertical scrollbar
            columns: (function(multi) {
                if ( multi ) {
                    return [{
                        dataIndex: 'id',
                        width:     40
                    }, {
                        dataIndex: 'name',
                        width:     126
                    }];
                }
                else {
                    return [{
                        dataIndex: 'id',
                        width:     40
                    }, {
                        dataIndex: 'name',
                        width:     146
                    }];
                }
            })(multiValue)
        }, {
            xtype: 'button',
            id:    'validateButton',
            text:  'Validate',
            handler: function() {
                var form, field;
                
                form  = Ext.getCmp('formPanel').getForm();
                field = Ext.getCmp('multiSelectField');
                
                if ( form.isValid() ) {
                    var values = form.getValues();
                    alert('Form is valid: ' + Ext.JSON.encode(values[ field.inputId ]));
                }
                else {
                    alert('Form is invalid');
                };
            }
        }, {
            xtype: 'button',
            id:    'closeFormButton',
            text:  'Close Form',
            handler: function() {
                var formPanel = Ext.getCmp('formPanel');
                
                formPanel.destroy();
            }
        }],
        
        renderTo: Ext.getBody()
	});
	
	var input = panel.query('multiselectfield');
	
	input && input[0] && input[0].focus();
});
