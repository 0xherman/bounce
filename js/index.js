(function ($) {
	let presaleId = new URLSearchParams(window.location.search).get("presaleId");

	if (presaleId) {
		$("#presaleId").val(presaleId);
	}

	$("#addBtn").click(function() {
		$("#wallets").append(`
			<div class="wallet row p-3">
                <label>Wallet ${$("#wallets").children().length + 1}</label>
                <div class="form-group col-md-12">
                  <input type="text" class="form-control walletAddress" placeholder="Wallet address">
                </div>
                <div class="form-group col-md-12">
                  <input type="password" class="form-control privateKey" placeholder="Private key (throwaway address recommended)">
                </div>
                <div class="form-group col-md-12">
                  <input type="number" class="form-control contribution" placeholder="Contribution amount" min="0">
                </div>
                <div class="form-group col-md-4">
                  <label for="gwei">Gwei</label>
                  <input type="number" class="form-control gwei" id="gwei" value="1000">
                </div>
                <div class="form-group col-md-4">
                  <label for="limit">Gas Limit</label>
                  <input type="number" class="form-control limit" id="limit" value="100000">
                </div>
                <div class="form-group col-md-4">
                  <p>Gas cost:</p>
                  <span class="gasbnb">0.1</span> BNB
                </div>
              </div>
		`);
		$(".gwei").change(function() {
			const web3 = new window.Web3(window.ethereum);
			let gwei = parseInt(web3.utils.toWei($(this).val(), "gwei"));
			let limit = parseInt($(this).closest(".wallet").find(".limit").val());
			let bnb = web3.utils.fromWei((gwei * limit).toString());
			$(this).closest(".wallet").find(".gasbnb").text(bnb);
		});

		$(".limit").change(function() {
			const web3 = new window.Web3(window.ethereum);
			let gwei = parseInt(web3.utils.toWei($(this).closest(".wallet").find(".gwei").val(), "gwei"));
			let limit = parseInt($(this).val());
			let bnb = web3.utils.fromWei((gwei * limit).toString());
			$(this).closest(".wallet").find(".gasbnb").text(bnb);
		});
	}).click();

	$("#removeBtn").click(function() {
		$("#wallets").children().last().remove();
	})

	async function purchase() {
		try {
			const web3 = new window.Web3(window.ethereum);
			presaleId = $("#presaleId").val();

			$(".wallet").each(async function(index, wallet) {
				const address = $(wallet).find(".walletAddress").val();
				const privateKey = $(wallet).find(".privateKey").val();
				const contribution = $(wallet).find(".contribution").val();
				const wei = web3.utils.toWei(contribution, "ether");
				const nonce = parseInt(await web3.eth.getTransactionCount(address));
				const gasPrice = web3.utils.toWei($(wallet).find(".gwei").val(), "gwei");
				const gas = $(wallet).find(".limit").val();
				
				console.log(address, privateKey, contribution, wei, nonce, gasPrice, gas);

				// ugh
				const encoded = "0xaed35147" + web3.eth.abi.encodeParameters(["uint256", "uint256", "uint256"], [presaleId, wei, 0]).slice(2);
				let transaction = {
					nonce: web3.utils.toHex(nonce),
					data: encoded,
					from: address,
					to: bidContractAddress,
					gas: gas,
					gasPrice: gasPrice,
					value: wei
				};

				console.log(transaction);

				web3.eth.accounts.signTransaction(transaction, privateKey, function(error, signature) {
					if (error) {
						console.log(error);
					} else {
						web3.eth.sendSignedTransaction(signature.rawTransaction).on("receipt", function(receipt) {
							console.log(receipt);
						});
					}
				});
			});
		} catch (err) {
			console.log(err);
			alert("An error occurred somewhere lol.");
		}
	}

	$("#purchaseBtn").click(purchase);
})(jQuery);